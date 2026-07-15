# Cursor Skill — Backlog

## Contexto

Work items usam tabela unificada com `type` e `parentId`.

## Regras

- Validar hierarquia pai-filho em `work-item.service.ts`
- Numeração sequencial por projectId
- Filtrar sempre por companyId do JWT

## Arquivos

- `backend/src/modules/work-item/`
- `frontend/src/pages/projects/BacklogPage.tsx`
