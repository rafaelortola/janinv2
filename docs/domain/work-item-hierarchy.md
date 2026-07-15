# Hierarquia de Work Items

## Tipos

| type | Pai permitido |
|------|---------------|
| EPIC | — (raiz) |
| FEATURE | EPIC |
| STORY | FEATURE, EPIC |
| TASK | STORY |
| TECH_TASK | STORY |
| SPIKE | EPIC, FEATURE |
| BUG | STORY, SPRINT |
| DEFECT | STORY (via QA) |
| HOTFIX | RELEASE |
| CHANGE_REQUEST | EPIC, RELEASE |

## Numeração

Formato `{projectKey}-{sequential}` ex: `ACME-42`

## Status workflow

`BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE → CANCELLED`

## Prioridade

`LOWEST, LOW, MEDIUM, HIGH, HIGHEST`
