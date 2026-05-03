export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "BananaControl API",
    version: "1.0.0",
    description: "API REST para gastos, vendas, perdas e lucro."
  },
  servers: [{ url: "http://localhost:3001" }],
  paths: {
    "/api/expenses": {
      get: { summary: "Lista gastos" },
      post: { summary: "Cria gasto" }
    },
    "/api/sales": {
      get: { summary: "Lista vendas" },
      post: { summary: "Cria venda" }
    },
    "/api/losses": {
      get: { summary: "Lista perdas" },
      post: { summary: "Cria perda" }
    },
    "/api/summary": {
      get: { summary: "Resumo financeiro" }
    },
    "/api/analytics": {
      get: { summary: "Series mensais e perdas por motivo" }
    }
  }
};
