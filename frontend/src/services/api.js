const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
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
  getSummary: (month) => request(`/summary${month ? `?month=${month}` : ""}`),
  getAnalytics: () => request("/analytics"),
  list: (resource, filters) => request(withQuery(`/${resource}`, filters)),
  create: (resource, payload) =>
    request(`/${resource}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (resource, id, payload) =>
    request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: "DELETE" })
};
