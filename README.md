# BananaControl

Aplicacao web responsiva para produtores acompanharem gastos, vendas, perdas, lucro e estoque de bananas, com painel administrativo e autenticacao.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: MySQL
- Autenticacao: JWT + bcrypt
- Graficos: Recharts
- Exportacao: Excel
- PWA: vite-plugin-pwa

## Funcionalidades

- Cadastro de produtores com estoque inicial e gastos iniciais opcionais.
- Login com JWT, role `USER`/`ADMIN` e bloqueio temporario apos tentativas falhas.
- Recuperacao de senha preparada no backend e link no frontend.
- Dashboard do produtor com estoque atual, filtros por mes ou periodo personalizado, graficos e exportacao.
- Registro de gastos, vendas e perdas por produtor autenticado.
- Bloqueio de vendas/perdas quando o estoque for insuficiente.
- Dashboard administrativo com metricas apenas de usuarios `USER`.
- Relatorios administrativos em `/admin/relatorios`.
- Gestao de usuarios com paginacao, bloqueio e exclusao.
- Criacao de novas contas administradoras por admin logado.
- Sidebar responsiva com menu mobile.
- Toasts para feedback de sucesso e erro.
- PWA instalavel.

## Primeiro Login

Depois de rodar o setup do banco:

```text
Admin master
E-mail: admin@bananacontrol.com
Senha: admin123

Produtor exemplo
E-mail: produtor@bananacontrol.com
Senha: produtor123
```

Troque a senha do admin em ambientes reais.

## Como Rodar

1. Configure `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=banana_control
FRONTEND_URL=http://localhost:5173
JWT_SECRET=troque_este_segredo
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=admin@bananacontrol.com
ADMIN_PASSWORD=admin123
SEED_SAMPLE_DATA=true
```

2. Prepare ou verifique o banco:

```bash
cd backend
npm run db:setup
npm run db:check
```

3. Rode o backend:

```bash
cd backend
npm run dev
```

4. Rode o frontend:

```bash
cd frontend
npm run dev
```

5. Acesse:

```text
Frontend: http://localhost:5173
Backend: http://localhost:3001
Swagger: http://localhost:3001/docs
```

## Scripts Uteis

Backend:

```bash
npm run dev
npm run start
npm run db:setup
npm run db:check
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```
