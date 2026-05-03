import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  initialStock: "",
  initialExpenses: ""
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Register() {
  const [form, setForm] = useState(initialForm);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);
  const navigate = useNavigate();
  const { register, persistSession } = useAuth();

  const passwordMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function validate() {
    if (!form.name.trim()) return "Nome não pode ser vazio";
    if (!form.email.trim()) return "Email não pode ser vazio";
    if (!form.password) return "Senha não pode ser vazio";
    if (!form.confirmPassword) return "Confirmar senha não pode ser vazio";
    if (!EMAIL_REGEX.test(form.email)) return "Formato de e-mail inválido";
    if (form.password !== form.confirmPassword) return "Senha e confirmação de senha devem ser iguais.";
    if (form.password.length < 6) return "Senha deve ter no mínimo 6 caracteres.";
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validate();

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      const result = await register(form);
      setPendingSession(result);
      setShowSuccessModal(true);
      setForm(initialForm);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleModalOk() {
    if (pendingSession) {
      persistSession(pendingSession);
      navigate(pendingSession.user.role === "ADMIN" ? "/admin" : "/", { replace: true });
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel large">
        <div className="auth-brand">
          <span className="brand-mark">BC</span>
          <div>
            <strong>BananaControl</strong>
            <p>Cadastro do produtor</p>
          </div>
        </div>

        <form className="form-card compact" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label className="field">
            <span>Senha</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </label>
          <label className="field">
            <span>Confirmação de Senha</span>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {passwordMismatch ? <small className="field-error">Senha e confirmação de senha devem ser iguais.</small> : null}
          </label>

          <label className="field">
            <span>
              Estoque Inicial de Bananas
              <button
                className="tooltip"
                type="button"
                title="Preencher este campo ajuda a iniciar o dashboard com o saldo real de bananas disponivel."
              >
                ?
              </button>
            </span>
            <input name="initialStock" type="number" step="0.01" value={form.initialStock} onChange={handleChange} />
          </label>

          <label className="field">
            <span>
              Valor de Gastos Iniciais
              <button
                className="tooltip"
                type="button"
                title="Preencher este campo registra os gastos iniciais e deixa o lucro inicial mais fiel."
              >
                ?
              </button>
            </span>
            <input
              name="initialExpenses"
              type="number"
              step="0.01"
              value={form.initialExpenses}
              onChange={handleChange}
            />
          </label>

          <button type="submit" disabled={Boolean(passwordMismatch)}>
            Cadastrar
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Já tenho uma conta</Link>
        </div>
      </section>

      {showSuccessModal ? (
        <div className="modal-backdrop">
          <div className="modal-card dialog-card">
            <h2>Cadastro realizado com sucesso!</h2>
            <p>Vamos abrir seu painel agora.</p>
            <button type="button" onClick={handleModalOk}>OK</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
