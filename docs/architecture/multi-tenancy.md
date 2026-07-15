# Multi-tenancy

## Modelo

Shared database com `companyId` em todas as tabelas de domínio.

## Isolamento

1. JWT contém `companyId` do tenant ativo
2. Guard NestJS `TenantGuard` injeta contexto
3. Prisma middleware filtra queries por `companyId`
4. PostgreSQL RLS como camada extra (produção)

## Seats

- Plano define `seatLimit`
- Admin contratante = 1º seat
- `seatsUsed` = membros ACTIVE + INVITED
- Bloqueio ao cadastrar se `seatsUsed >= seatLimit`

## Roles

| systemRole | Permissão |
|------------|-----------|
| ADMIN | Gerenciar org, membros, plano |
| MEMBER | Usar projetos e work items |

| jobRole | Função |
|---------|--------|
| QA, DEV, PO, TECH_LEAD, DESIGNER, SCRUM_MASTER, OTHER | Exibição e filtros |
