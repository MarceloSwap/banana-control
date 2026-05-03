import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Usuário e senha precisam ser preenchidos");
      return;
    }

    try {
      const user = await login(form);
      navigate(user.role === "ADMIN" ? "/admin" : "/", { replace: true });
    } catch (error) {
      toast.error(error.message || "Credenciais inválidas.");
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">BC</span>
          <div>
            <strong>BananaControl</strong>
            <p>Entrar na sua conta</p>
          </div>
        </div>

        <form className="form-card compact" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>

          <label className="field">
            <span>Senha</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </label>

          <button type="submit">Entrar</button>
        </form>

        <div className="auth-links">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
          <Link to="/cadastro">Criar nova conta</Link>
        </div>
      </section>
    </main>
  );
}
