import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { SimpleBarChart } from "../components/SimpleBarChart";
import { api } from "../services/api";

const adminFormInitial = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  initialStock: "",
  initialExpenses: ""
};

const PAGE_SIZE = 10;
const PIE_COLORS = ["#2f6b3d", "#f3c623", "#b53d2d", "#3b6ea8", "#7a4c9a"];

export function AdminDashboard({ reportsOnly = false }) {
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState(adminFormInitial);
  const [page, setPage] = useState(1);

  async function loadAdminData() {
    const [dashboard, reportRows, producerRows] = await Promise.all([
      api.adminDashboard(),
      api.adminReports(),
      api.adminUsers()
    ]);
    setMetrics(dashboard);
    setReports(reportRows);
    setUsers(producerRows);
  }

  useEffect(() => {
    loadAdminData().catch((error) => toast.error(error.message));
  }, []);

  const pageCount = Math.max(Math.ceil(users.length / PAGE_SIZE), 1);
  const paginatedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleBlock(id) {
    try {
      await api.blockUser(id);
      toast.success("Conta bloqueada com sucesso.");
      await loadAdminData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja excluir esta conta?")) return;

    try {
      await api.deleteUser(id);
      toast.success("Conta excluída com sucesso.");
      await loadAdminData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();

    try {
      await api.createAdmin(adminForm);
      toast.success("Administrador cadastrado com sucesso.");
      setAdminForm(adminFormInitial);
      setShowAdminForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (reportsOnly) {
    return (
      <section className="page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">Administração</p>
            <h1>Relatórios Macro</h1>
            <p>Cruzamento de estoque, perdas, crescimento de usuários e finanças dos produtores.</p>
          </div>
        </header>

        <section className="summary-grid">
          <article className="card metric">
            <p>Bananas de produtores</p>
            <strong>{Number(reports?.totals.totalBananas || 0).toFixed(2)} kg</strong>
          </article>
          <article className="card metric">
            <p>Gastos de produtores</p>
            <strong>{Number(reports?.totals.totalExpenses || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </article>
          <article className="card metric">
            <p>Vendas de produtores</p>
            <strong>{Number(reports?.totals.totalSales || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </article>
          <article className="card metric">
            <p>Perdas de produtores</p>
            <strong>{Number(reports?.totals.totalLosses || 0).toFixed(2)} kg</strong>
          </article>
        </section>

        <section className="report-grid">
          <article className="card chart-card">
            <h2>Perdas por Motivo</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={reports?.lossesByReason || []} dataKey="total" nameKey="reason" outerRadius={110} label>
                    {(reports?.lossesByReason || []).map((entry, index) => (
                      <Cell key={entry.reason} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card chart-card">
            <h2>Crescimento de Usuários</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" name="Novos usuários" fill="#2f6b3d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card chart-card wide">
            <h2>Gastos vs Vendas por Mês</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={reports?.monthlyFinance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="expenses" name="Gastos" fill="#b53d2d" />
                  <Bar dataKey="sales" name="Vendas" fill="#2f6b3d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <header className="page-header row-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Painel Administrativo</h1>
          <p>Visão macro dos produtores, estoque total e contas cadastradas.</p>
        </div>
        <button type="button" onClick={() => setShowAdminForm(true)}>
          Novo Admin
        </button>
      </header>

      <section className="summary-grid">
        <article className="card metric">
          <p>Usuários cadastrados</p>
          <strong>{metrics?.users.total || 0}</strong>
          <span>{metrics?.users.active || 0} ativos / {metrics?.users.inactive || 0} inativos</span>
        </article>
        <article className="card metric">
          <p>Volume total de bananas</p>
          <strong>{Number(metrics?.totalBananas || 0).toFixed(2)} kg</strong>
        </article>
        <article className="card metric">
          <p>Produtores na tabela</p>
          <strong>{users.length}</strong>
        </article>
      </section>

      <div className="dashboard-charts">
        <SimpleBarChart
          title="Novos cadastros"
          subtitle="Últimos 30 dias"
          data={metrics?.registrationsLast30Days || []}
          valueKey="total"
          labelKey="date"
          kind="unit"
        />

        <section className="card list-card">
          <div className="section-title">
            <h2>Gestão de usuários</h2>
            <span>{users.length} produtores</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Data de Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.status}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="table-actions">
                      <button type="button" className="ghost" onClick={() => handleBlock(user.id)}>
                        Bloquear
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(user.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button type="button" className="ghost" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </button>
            <span>Página {page} de {pageCount}</span>
            <button
              type="button"
              className="ghost"
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </button>
          </div>
        </section>
      </div>

      {showAdminForm ? (
        <div className="modal-backdrop">
          <form className="modal-card form-card" onSubmit={handleCreateAdmin}>
            <div className="section-title">
              <h2>Novo administrador</h2>
              <button type="button" className="ghost icon-button" onClick={() => setShowAdminForm(false)}>
                X
              </button>
            </div>
            <label className="field">
              <span>Nome</span>
              <input
                value={adminForm.name}
                onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={adminForm.email}
                onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                value={adminForm.password}
                onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Confirmar senha</span>
              <input
                type="password"
                value={adminForm.confirmPassword}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </label>
            <button type="submit">Cadastrar admin</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
