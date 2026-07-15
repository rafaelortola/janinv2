# Janin v2 — SaaS de Gestão de Projetos e QA

Plataforma multi-tenant inspirada em Jira/Azure DevOps, com foco em rastreabilidade QA.

## Stack

- **Frontend:** React 19 + Vite + Tailwind + TanStack Query + Zustand + dnd-kit
- **Backend:** NestJS + Prisma + PostgreSQL
- **Produção:** Express (Node.js) + PM2 + Nginx

## Setup local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (local, Docker ou cloud)
- Docker (opcional, recomendado para subir o banco rapidamente)

### Banco de dados (Docker)

Na raiz do projeto:

```bash
docker compose up -d
```

Isso sobe o PostgreSQL em `localhost:5432` com usuário/senha/banco `janin`/`janin`/`janinv2`, compatível com o `.env.example`.

### Backend

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL se necessário
npm install            # já roda `prisma generate` via postinstall
npm run db:push        # gera o client + sincroniza o schema no banco
npm run db:seed
npm run start:dev      # http://localhost:8000/api/v1
```

### Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `P1001: Can't reach database server` | PostgreSQL não está rodando | `docker compose up -d` ou inicie seu Postgres local |
| `Module '@prisma/client' has no exported member ...` | Cliente Prisma não gerado | `cd backend && npx prisma generate` (ou `npm install` de novo) |
| `password authentication failed` | `DATABASE_URL` incorreta | Confira `.env` com as credenciais do banco |

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Credenciais demo (seed)

- **Admin:** admin@acme.com / Admin@123
- **Membros:** ana@acme.com, bruno@acme.com, etc. / Member@123

## Produção (Node.js)

```bash
cd frontend && npm run build
cd backend && npm run build
pm2 start ecosystem.config.cjs
```

## Documentação

Ver [`docs/`](docs/) — PRD, arquitetura, ERD, regras de negócio, APIs.

## Módulos

- Multi-tenant + licenciamento por seats
- Backlog hierárquico (Epic → Story → Task...)
- Kanban com drag-and-drop e swimlanes
- Sprints (planning, burndown, velocity)
- QA (test cases, execuções, defects, matriz de rastreabilidade)
- Releases / timeline
