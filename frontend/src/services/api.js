const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getToken() {
  return localStorage.getItem("banana_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem("banana_token");
      localStorage.removeItem("banana_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error(data.message || "Nao foi possivel concluir a operacao.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (payload) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) }),
  adminDashboard: () => request("/admin/dashboard"),
  adminReports: () => request("/admin/relatorios"),
  adminUsers: () => request("/admin/users"),
  blockUser: (id) => request(`/admin/users/${id}/block`, { method: "PATCH" }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
  createAdmin: (payload) => request("/admin/admins", { method: "POST", body: JSON.stringify(payload) }),
  addStock: (payload) => request("/inventory/add", { method: "POST", body: JSON.stringify(payload) }),
  getSummary: (filters = {}) => request(withQuery("/summary", filters)),
  getAnalytics: (filters = {}) => request(withQuery("/analytics", filters)),
  list: (resource, filters) => request(withQuery(`/${resource}`, filters)),
  create: (resource, payload) =>
    request(`/${resource}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (resource, id, payload) =>
    request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: "DELETE" })
};
