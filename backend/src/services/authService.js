import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCK_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 3;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateRequiredRegistration({ name, email, password, confirmPassword }) {
  if (!String(name || "").trim()) return "Nome não pode ser vazio";
  if (!String(email || "").trim()) return "Email não pode ser vazio";
  if (!String(password || "")) return "Senha não pode ser vazio";
  if (!String(confirmPassword || "")) return "Confirmar senha não pode ser vazio";
  return null;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function toSafeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function registerUser(payload, role = "USER") {
  const requiredMessage = validateRequiredRegistration(payload);
  if (requiredMessage) {
    const error = new Error(requiredMessage);
    error.status = 400;
    throw error;
  }

  const email = normalizeEmail(payload.email);
  if (!EMAIL_REGEX.test(email)) {
    const error = new Error("Formato de e-mail inválido");
    error.status = 400;
    throw error;
  }

  if (payload.password !== payload.confirmPassword) {
    const error = new Error("Senha e confirmacao de senha devem ser iguais.");
    error.status = 400;
    throw error;
  }

  if (payload.password.length < 6) {
    const error = new Error("Senha deve ter no mínimo 6 caracteres.");
    error.status = 400;
    throw error;
  }

  const initialStock = toOptionalNumber(payload.initialStock);
  const initialExpenses = toOptionalNumber(payload.initialExpenses);

  if (Number.isNaN(initialStock) || Number.isNaN(initialExpenses)) {
    const error = new Error("Estoque inicial e gastos iniciais devem ser numericos.");
    error.status = 400;
    throw error;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [payload.name.trim(), email, passwordHash, role]
    );

    const userId = userResult.insertId;

    if (initialStock !== null) {
      await connection.query(
        "INSERT INTO inventories (user_id, current_quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_quantity = VALUES(current_quantity)",
        [userId, initialStock]
      );
      await connection.query(
        "INSERT INTO stock_movements (user_id, type, quantity, note) VALUES (?, 'INITIAL', ?, ?)",
        [userId, initialStock, "Estoque inicial informado no cadastro"]
      );
    } else {
      await connection.query("INSERT INTO inventories (user_id, current_quantity) VALUES (?, 0)", [userId]);
    }

    if (initialExpenses !== null) {
      await connection.query(
        "INSERT INTO expenses (user_id, type, amount, expense_date) VALUES (?, ?, ?, CURDATE())",
        [userId, "gastos iniciais", initialExpenses]
      );
    }

    await connection.commit();

    // TODO: implementar aqui o disparo de e-mail com as credenciais de acesso do usuario cadastrado.
    const safeUser = toSafeUser({ id: userId, name: payload.name.trim(), email, role });
    return {
      id: userId,
      token: issueToken(safeUser),
      user: safeUser,
      message: "Cadastro realizado com sucesso!"
    };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      error.status = 409;
      error.message = "E-mail ja cadastrado.";
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function loginUser({ email, password }) {
  if (!String(email || "").trim() || !String(password || "")) {
    const error = new Error("Usuário e senha precisam ser preenchidos");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const [[user]] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

  if (!user) {
    const error = new Error("Credenciais invalidas.");
    error.status = 401;
    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("Conta bloqueada. Entre em contato com o administrador.");
    error.status = 403;
    throw error;
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    const error = new Error("Muitas tentativas falhas. Tente novamente em 5 minutos.");
    error.status = 429;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    const attempts = Number(user.failed_login_attempts || 0) + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await pool.query(
      "UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?",
      [shouldLock ? 0 : attempts, shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null, user.id]
    );

    const error = new Error(
      shouldLock ? "Muitas tentativas falhas. Tente novamente em 5 minutos." : "Credenciais invalidas."
    );
    error.status = shouldLock ? 429 : 401;
    throw error;
  }

  await pool.query("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?", [user.id]);

  const safeUser = toSafeUser(user);
  return { token: issueToken(safeUser), user: safeUser };
}

export async function requestPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    const error = new Error("Formato de e-mail inválido");
    error.status = 400;
    throw error;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    "UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE email = ?",
    [resetToken, resetExpiresAt, normalizedEmail]
  );

  // TODO: implementar aqui o envio de e-mail com o link de recuperacao contendo o token gerado.
  return { message: "Se o e-mail existir, enviaremos as instrucoes de recuperacao." };
}
