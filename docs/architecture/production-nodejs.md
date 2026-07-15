# Produção Node.js

## Processos PM2

| Nome | Comando | Porta |
|------|---------|-------|
| frontend | `node frontend/server.js` | 3000 |
| backend | `node backend/dist/main.js` | 8000 |

## Deploy

```bash
cd frontend && npm ci && npm run build
cd backend && npm ci && npm run build && npx prisma migrate deploy
pm2 start ecosystem.config.cjs
```

## Nginx

Proxy HTTPS → Express :3000. Express faz proxy `/api` → NestJS :8000.

## Variáveis

Ver `.env.production.example` na raiz do repositório.
