# Janin v2 — SaaS de Gestão de Projetos e QA

Plataforma multi-tenant inspirada em Jira/Azure DevOps, com foco em rastreabilidade QA.

## Stack

- **Frontend:** React 19 + Vite + Tailwind + TanStack Query + Zustand + dnd-kit
- **Backend:** NestJS + Prisma + PostgreSQL
- **Produção:** Express (Node.js) + PM2 + Nginx

## Setup local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (local ou cloud)

### Backend

```bash
cd backend
cp .env.example .env   # configure DATABASE_URL
npm install
npx prisma db push
npm run db:seed
npm run start:dev      # http://localhost:8000/api/v1
```

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
