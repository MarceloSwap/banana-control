import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ResourcePage } from "./components/ResourcePage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminDashboard } from "./pages/AdminDashboard";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

const expenseFields = [
  { name: "type", label: "Tipo", options: ["transporte", "adubo", "mao de obra", "gastos iniciais"] },
  { name: "amount", label: "Valor", type: "number", step: "0.01" },
  { name: "date", label: "Data", type: "date" }
];

const salesFields = [
  { name: "quantity", label: "Quantidade (kg)", type: "number", step: "0.01" },
  { name: "price", label: "Preço por kg", type: "number", step: "0.01" },
  { name: "date", label: "Data", type: "date" }
];

const lossFields = [
  { name: "quantity", label: "Quantidade perdida (kg)", type: "number", step: "0.01" },
  { name: "reason", label: "Motivo", options: ["transporte", "amadurecimento", "estrago"] },
  { name: "date", label: "Data", type: "date" }
];

function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <header className="mobile-topbar">
        <div className="brand">
          <span className="brand-mark">BC</span>
          <strong>BananaControl</strong>
        </div>
        <button
          type="button"
          className="ghost menu-button"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          ☰
        </button>
      </header>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">BC</span>
          <div>
            <strong>BananaControl</strong>
            <p>{user.role === "ADMIN" ? "Painel administrativo" : "Painel do produtor"}</p>
          </div>
        </div>

        <nav>
          {user.role === "ADMIN" ? (
            <>
              <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>
              <NavLink to="/admin/relatorios" onClick={closeMenu}>Relatórios</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" onClick={closeMenu}>Resumo</NavLink>
              <NavLink to="/gastos" onClick={closeMenu}>Gastos</NavLink>
              <NavLink to="/vendas" onClick={closeMenu}>Vendas</NavLink>
              <NavLink to="/perdas" onClick={closeMenu}>Perdas</NavLink>
            </>
          )}
        </nav>

        <button type="button" className="ghost logout-button" onClick={handleLogout}>
          Sair
        </button>
      </aside>

      <main className="content">
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/relatorios"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard reportsOnly />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute role="USER">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gastos"
            element={
              <ProtectedRoute role="USER">
                <ResourcePage
                  resource="expenses"
                  title="Registrar gastos"
                  description="Controle transporte, adubo e mão de obra em poucos toques."
                  fields={expenseFields}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <ProtectedRoute role="USER">
                <ResourcePage
                  resource="sales"
                  title="Registrar vendas"
                  description="Acompanhe quantidade, preço e faturamento em tempo real."
                  fields={salesFields}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perdas"
            element={
              <ProtectedRoute role="USER">
                <ResourcePage
                  resource="losses"
                  title="Registrar perdas"
                  description="Veja onde você está perdendo banana e aja mais rápido."
                  fields={lossFields}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={user.role === "ADMIN" ? "/admin" : "/"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
      <Shell />
    </AuthProvider>
  );
}
