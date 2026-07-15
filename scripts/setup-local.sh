#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"

echo "==> Configurando Janin v2 (banco + admin)"

if [ ! -f "$BACKEND/.env" ]; then
  echo "Criando backend/.env a partir de .env.example"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo "Ajuste DATABASE_URL em backend/.env se seu Postgres usar outras credenciais."
fi

cd "$BACKEND"
npm install
npx prisma generate
npx prisma db push
npm run db:ensure-admin

echo ""
echo "Setup concluído!"
echo "Credenciais: admin / admin  (ou admin@admin.com / admin)"
echo ""
echo "Suba os servidores:"
echo "  cd backend && npm run start:dev"
echo "  cd frontend && npm run dev"
echo "Acesse: http://localhost:5173/login"
