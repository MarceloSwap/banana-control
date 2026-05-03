import { Link } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const result = await api.forgotPassword({ email });
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">BC</span>
          <div>
            <strong>BananaControl</strong>
            <p>Recuperação de senha</p>
          </div>
        </div>

        <form className="form-card compact" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button type="submit">Enviar instruções</button>
        </form>

        <div className="auth-links">
          <Link to="/login">Voltar para login</Link>
        </div>
      </section>
    </main>
  );
}
