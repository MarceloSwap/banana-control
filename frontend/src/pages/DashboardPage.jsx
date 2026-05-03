import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import { api } from "../services/api";

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function DashboardPage() {
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalSales: 0,
    totalLosses: 0,
    totalProfit: 0
  });
  const [filterMode, setFilterMode] = useState("month");
  const [month, setMonth] = useState(currentMonth);
  const [customPeriod, setCustomPeriod] = useState({ startDate: "", endDate: "" });
  const [analytics, setAnalytics] = useState({ monthly: [], lossesByReason: [] });
  const [stockQuantity, setStockQuantity] = useState("");

  function activeFilters() {
    if (filterMode === "custom") {
      return {
        startDate: customPeriod.startDate,
        endDate: customPeriod.endDate
      };
    }

    return { month };
  }

  async function loadSummary() {
    const filters = activeFilters();
    const [summaryData, analyticsData] = await Promise.all([api.getSummary(filters), api.getAnalytics(filters)]);
    setSummary(summaryData);
    setAnalytics(analyticsData);
  }

  useEffect(() => {
    loadSummary().catch((error) => toast.error(error.message));
  }, [month, filterMode, customPeriod.startDate, customPeriod.endDate]);

  async function handleAddStock(event) {
    event.preventDefault();

    try {
      await api.addStock({ quantity: stockQuantity });
      toast.success("Estoque atualizado com sucesso.");
      setStockQuantity("");
      await loadSummary();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleExport() {
    const rows = [
      {
        estoqueAtualKg: summary.currentStock || 0,
        totalGastos: summary.totalExpenses || 0,
        totalVendas: summary.totalSales || 0,
        lucroFinal: summary.totalProfit || 0,
        perdasKg: summary.totalLosses || 0
      }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Resumo");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analytics.monthly), "Gastos vs Vendas");
    XLSX.writeFile(workbook, `banana-control-relatorio-${Date.now()}.xlsx`);
    toast.success("Relatório exportado.");
  }

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
        <div className="filter-panel">
          <label className="field">
            <span>Filtro</span>
            <select value={filterMode} onChange={(event) => setFilterMode(event.target.value)}>
              <option value="month">Mês</option>
              <option value="custom">Período Personalizado</option>
            </select>
          </label>
          {filterMode === "month" ? (
            <label className="field month-filter">
              <span>Resumo mensal</span>
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
          ) : (
            <div className="filter-grid">
              <label className="field">
                <span>Data Inicial</span>
                <input
                  type="date"
                  value={customPeriod.startDate}
                  onChange={(event) => setCustomPeriod((current) => ({ ...current, startDate: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Data Final</span>
                <input
                  type="date"
                  value={customPeriod.endDate}
                  onChange={(event) => setCustomPeriod((current) => ({ ...current, endDate: event.target.value }))}
                />
              </label>
            </div>
          )}
        </div>
      </header>

      <section className="summary-grid">
        <article className="card metric stock-highlight">
          <p>Estoque Atual de Bananas</p>
          <strong>{Number(summary.currentStock || 0).toFixed(2)} kg</strong>
        </article>
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

      <section className="card stock-form">
        <div>
          <h2>Adicionar ao Estoque</h2>
          <p>Registre novas colheitas ou entradas de banana no saldo disponível.</p>
        </div>
        <form className="inline-form" onSubmit={handleAddStock}>
          <label className="field">
            <span>Quantidade (kg)</span>
            <input
              type="number"
              step="0.01"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
            />
          </label>
          <button type="submit">Adicionar ao Estoque</button>
        </form>
      </section>

      <section className="card chart-card">
        <div className="section-title">
          <div>
            <h2>Gastos vs Vendas</h2>
            <span>Relatório simples do produtor</span>
          </div>
          <button type="button" className="ghost" onClick={handleExport}>Exportar Dados</button>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalExpenses" name="Gastos" fill="#b53d2d" />
              <Bar dataKey="totalSales" name="Vendas" fill="#2f6b3d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </section>
  );
}
