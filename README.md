# BananaControl

Aplicacao web responsiva com cara de app para controle de gastos, vendas, perdas e lucro de produtores e vendedores de banana.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: MySQL
- Documentacao: Swagger
- Instalavel no celular: PWA

## Estrutura

- `frontend/`: interface responsiva e PWA
- `backend/`: API REST e Swagger
- `docs/schema.sql`: schema inicial do banco

## Como rodar

1. Crie o banco MySQL e execute `docs/schema.sql`.
2. Configure `backend/.env` com suas credenciais.
3. Instale dependencias em `frontend` e `backend`.
4. Rode o backend com `npm run dev`.
5. Rode o frontend com `npm run dev`.

## MVP atual

- Cadastro de gastos
- Cadastro de vendas
- Cadastro de perdas
- Resumo financeiro
- Layout mobile-first
- Manifest e service worker base para PWA

