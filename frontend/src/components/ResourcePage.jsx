import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";

const labels = {
  expenses: "gasto",
  sales: "venda",
  losses: "perda"
};

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentMonthRange() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function normalizeDate(value) {
  return String(value || "").slice(0, 10);
}

function emptyForm(resource) {
  const date = today();
  const emptyByResource = {
    expenses: { type: "transporte", amount: "", date },
    sales: { quantity: "", price: "", date },
    losses: { quantity: "", reason: "transporte", date }
  };
  return emptyByResource[resource];
}

function defaultFilters() {
  return { ...currentMonthRange(), type: "", reason: "" };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

export function ResourcePage({ resource, title, description, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => emptyForm(resource));
  const [filters, setFilters] = useState(defaultFilters);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await api.list(resource, filters);
      setItems(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [resource, filters.startDate, filters.endDate, filters.type, filters.reason]);

  useEffect(() => {
    setForm(emptyForm(resource));
    setFilters(defaultFilters());
    setEditingId(null);
  }, [resource]);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleFilterChange(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await api.update(resource, editingId, form);
        toast.success(`${labels[resource]} atualizado com sucesso.`);
      } else {
        await api.create(resource, form);
        toast.success(`${labels[resource]} criado com sucesso.`);
      }
      setForm(emptyForm(resource));
      setEditingId(null);
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Deseja remover este registro?");
    if (!confirmed) return;

    try {
      await api.remove(resource, id);
      toast.success(`${labels[resource]} removido com sucesso.`);
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function startEdit(item) {
    const base = { ...item };
    if (resource === "expenses") setForm({ type: base.type, amount: base.amount, date: normalizeDate(base.date) });
    if (resource === "sales") setForm({ quantity: base.quantity, price: base.price, date: normalizeDate(base.date) });
    if (resource === "losses") setForm({ quantity: base.quantity, reason: base.reason, date: normalizeDate(base.date) });
    setEditingId(item.id);
  }

  const totals = items.reduce(
    (accumulator, item) => {
      if (resource === "expenses") {
        accumulator.primary += Number(item.amount || 0);
      }
      if (resource === "sales") {
        accumulator.primary += Number(item.total || 0);
        accumulator.secondary += Number(item.quantity || 0);
      }
      if (resource === "losses") {
        accumulator.primary += Number(item.quantity || 0);
      }
      return accumulator;
    },
    { primary: 0, secondary: 0 }
  );

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">BananaControl</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <div className="page-grid">
        <div className="stack-column">
          <form className="card form-card" onSubmit={handleSubmit}>
            <h2>{editingId ? "Editar registro" : "Novo registro"}</h2>
            {fields.map((field) => (
              <label key={field.name} className="field">
                <span>{field.label}</span>
                {field.options ? (
                  <select name={field.name} value={form[field.name]} onChange={handleChange}>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    step={field.step}
                  />
                )}
              </label>
            ))}

            <div className="actions">
              <button type="submit">{editingId ? "Salvar" : "Adicionar"}</button>
              {editingId ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm(resource));
                  }}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <section className="card filter-card">
            <div className="section-title">
              <h2>Filtros</h2>
              <span>Refine o periodo</span>
            </div>

            <div className="filter-grid">
              <label className="field">
                <span>Data inicial</span>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
              </label>
              <label className="field">
                <span>Data final</span>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
              </label>
              {resource === "expenses" ? (
                <label className="field">
                  <span>Tipo</span>
                  <select name="type" value={filters.type} onChange={handleFilterChange}>
                    <option value="">Todos</option>
                    <option value="transporte">transporte</option>
                    <option value="adubo">adubo</option>
                    <option value="mao de obra">mao de obra</option>
                  </select>
                </label>
              ) : null}
              {resource === "losses" ? (
                <label className="field">
                  <span>Motivo</span>
                  <select name="reason" value={filters.reason} onChange={handleFilterChange}>
                    <option value="">Todos</option>
                    <option value="transporte">transporte</option>
                    <option value="amadurecimento">amadurecimento</option>
                    <option value="estrago">estrago</option>
                  </select>
                </label>
              ) : null}
            </div>
            <div className="actions">
              <button type="button" className="ghost" onClick={() => setFilters(defaultFilters())}>
                Mês atual
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setFilters((current) => ({ ...current, startDate: "", endDate: "" }))}
              >
                Ver tudo
              </button>
            </div>
          </section>
        </div>

        <div className="card list-card">
          <div className="section-title">
            <h2>Registros</h2>
            <span>{items.length} itens</span>
          </div>

          <div className="mini-metrics">
            <article>
              <p>Total no filtro</p>
              <strong>
                {resource === "losses"
                  ? `${totals.primary.toFixed(2)} kg`
                  : formatCurrency(totals.primary)}
              </strong>
            </article>
            {resource === "sales" ? (
              <article>
                <p>Quantidade vendida</p>
                <strong>{totals.secondary.toFixed(2)} kg</strong>
              </article>
            ) : null}
          </div>

          {loading ? <p>Carregando...</p> : null}

          <div className="mobile-list">
            {items.map((item) => (
              <article key={item.id} className="list-item">
                <div>
                  <strong>{resource === "expenses" ? item.type : resource === "losses" ? item.reason : `${item.quantity} kg`}</strong>
                  <p>{item.date}</p>
                </div>
                <div className="item-metrics">
                  {item.amount ? <span>{formatCurrency(item.amount)}</span> : null}
                  {item.price ? <span>{formatCurrency(item.total)}</span> : null}
                  {item.quantity && resource === "losses" ? <span>{item.quantity} kg</span> : null}
                </div>
                <div className="item-actions">
                  <button type="button" className="ghost" onClick={() => startEdit(item)}>
                    Editar
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(item.id)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
            {!loading && items.length === 0 ? (
              <p className="empty-state">Nenhum registro encontrado para os filtros informados.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
