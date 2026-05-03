import { NavLink, Route, Routes } from "react-router-dom";
import { ResourcePage } from "./components/ResourcePage";
import { DashboardPage } from "./pages/DashboardPage";

const expenseFields = [
  { name: "type", label: "Tipo", options: ["transporte", "adubo", "mao de obra"] },
  { name: "amount", label: "Valor", type: "number", step: "0.01" },
  { name: "date", label: "Data", type: "date" }
];

const salesFields = [
  { name: "quantity", label: "Quantidade (kg)", type: "number", step: "0.01" },
  { name: "price", label: "Preco por kg", type: "number", step: "0.01" },
  { name: "date", label: "Data", type: "date" }
];

const lossFields = [
  { name: "quantity", label: "Quantidade perdida (kg)", type: "number", step: "0.01" },
  { name: "reason", label: "Motivo", options: ["transporte", "amadurecimento", "estrago"] },
  { name: "date", label: "Data", type: "date" }
];

export default function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">BC</span>
          <div>
            <strong>BananaControl</strong>
            <p>Pratico no celular</p>
          </div>
        </div>

        <nav>
          <NavLink to="/">Resumo</NavLink>
          <NavLink to="/gastos">Gastos</NavLink>
          <NavLink to="/vendas">Vendas</NavLink>
          <NavLink to="/perdas">Perdas</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/gastos"
            element={
              <ResourcePage
                resource="expenses"
                title="Registrar gastos"
                description="Controle transporte, adubo e mao de obra em poucos toques."
                fields={expenseFields}
              />
            }
          />
          <Route
            path="/vendas"
            element={
              <ResourcePage
                resource="sales"
                title="Registrar vendas"
                description="Acompanhe quantidade, preco e faturamento em tempo real."
                fields={salesFields}
              />
            }
          />
          <Route
            path="/perdas"
            element={
              <ResourcePage
                resource="losses"
                title="Registrar perdas"
                description="Veja onde voce esta perdendo banana e aja mais rapido."
                fields={lossFields}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

