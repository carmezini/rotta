# Rotta

Um painel pessoal neo-brutalista para acompanhar metas, hábitos e limites por meio de check-ins.

## Rodando localmente

Pré-requisitos: Go e Node.js.

Em um terminal:

```bash
cd backend
go run ./cmd/api
```

Sem configuração adicional, a API usa memória e fica disponível em `http://localhost:8080`. Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:3000`. O frontend usa `http://localhost:8080/api` por padrão.

## Persistência com PostgreSQL

Defina `DATABASE_URL`. Ao iniciar, a API aplica automaticamente a migração idempotente localizada em `backend/internal/config/migrations/001_initial.sql`. Os arquivos `.env.example` documentam as variáveis disponíveis.

> O modo em memória é ideal para experimentar, mas os dados são apagados quando a API reinicia.

## Estrutura

- `frontend`: Next.js, React e Tailwind CSS
- `backend`: API Go com Gin
- `backend/internal/repository`: contratos e implementações em memória/PostgreSQL
- `backend/internal/config/migrations`: esquema incorporado à API

## Publicação no Render

O `render.yaml` na raiz descreve o PostgreSQL, a API e o frontend. No Render, crie um Blueprint a partir deste repositório. Quando solicitado, informe:

- `FRONTEND_URL`: URL pública do frontend, sem barra final (ex.: `https://rotta-web.onrender.com`)
- `NEXT_PUBLIC_API_URL`: URL pública da API com `/api` (ex.: `https://rotta-api.onrender.com/api`)

O backend usa automaticamente a URL interna do PostgreSQL gerenciado. Nunca use `localhost` nas variáveis do Render.
