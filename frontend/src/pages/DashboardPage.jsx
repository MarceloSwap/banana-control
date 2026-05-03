import { useEffect, useState } from "react";
import { api } from "../services/api";

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

export function DashboardPage() {
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalSales: 0,
    totalLosses: 0,
    totalProfit: 0
  });
  const [month, setMonth] = useState("");

  useEffect(() => {
    api.getSummary(month).then(setSummary).catch(console.error);
  }, [month]);

  return (
    <section className="page-shell">
      <header className="hero">
        <div>
          <h1>Controle financeiro da sua banana em um so lugar</h1>
          <p>
            Registre gastos, vendas e perdas pelo celular com uma interface simples
            e preparada para instalacao como app.
          </p>
        </div>
        <label className="field month-filter">
          <span>Resumo mensal</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </header>

      <section className="summary-grid">
        <article className="card metric">
          <p>Total de gastos</p>
          <strong>{money(summary.totalExpenses)}</strong>
        </article>
        <article className="card metric">
          <p>Total de vendas</p>
          <strong>{money(summary.totalSales)}</strong>
        </article>
        <article className="card metric">
          <p>Lucro final</p>
          <strong>{money(summary.totalProfit)}</strong>
        </article>
        <article className="card metric">
          <p>Perdas registradas</p>
          <strong>{summary.totalLosses} kg</strong>
        </article>
      </section>
    </section>
  );
}

