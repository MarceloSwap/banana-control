import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem("banana_user");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  async function login(payload) {
    const data = await api.login(payload);
    persistSession(data);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    return data;
  }

  function persistSession(data) {
    localStorage.setItem("banana_token", data.token);
    localStorage.setItem("banana_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("banana_token");
    localStorage.removeItem("banana_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, register, persistSession, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
