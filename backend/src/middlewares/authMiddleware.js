import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticate(request, response, next) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: "Token nao informado." });
  }

  try {
    request.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (_error) {
    return response.status(401).json({ message: "Token invalido ou expirado." });
  }
}

export function authorizeAdmin(request, response, next) {
  if (request.user?.role !== "ADMIN") {
    return response.status(403).json({ message: "Acesso permitido apenas para administradores." });
  }

  next();
}
