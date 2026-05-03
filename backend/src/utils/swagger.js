export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "BananaControl API",
    version: "1.0.0",
    description: "API REST para gastos, vendas, perdas e lucro."
  },
  servers: [{ url: "http://localhost:3001" }],
  paths: {
    "/api/auth/register": {
      post: { summary: "Cadastra produtor com estoque e gastos iniciais opcionais" }
    },
    "/api/auth/login": {
      post: { summary: "Autentica usuario e retorna JWT com role" }
    },
    "/api/auth/forgot-password": {
      post: { summary: "Gera token de recuperacao de senha" }
    },
    "/api/admin/dashboard": {
      get: { summary: "Metricas administrativas protegidas por role ADMIN" }
    },
    "/api/admin/relatorios": {
      get: { summary: "Relatorios macro administrativos calculados apenas com usuarios USER" }
    },
    "/api/admin/users": {
      get: { summary: "Lista produtores" }
    },
    "/api/admin/admins": {
      post: { summary: "Cria nova conta ADMIN" }
    },
    "/api/inventory/add": {
      post: { summary: "Adiciona bananas ao estoque do produtor autenticado" }
    },
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
