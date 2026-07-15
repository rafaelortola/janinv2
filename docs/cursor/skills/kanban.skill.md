# Cursor Skill — Kanban

## Contexto

Board usa BoardColumn + WorkItem.position + WorkItem.status.

## Regras

- dnd-kit para drag entre colunas
- PATCH /work-items/:id/move atualiza status, columnId, position
- Swimlanes = agrupamento client-side por assigneeId ou epicId

## Arquivos

- `backend/src/modules/board/`
- `frontend/src/pages/projects/BoardPage.tsx`
