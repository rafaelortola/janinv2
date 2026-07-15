# API — Especificação

Base: `/api/v1`

## Auth

| Method | Path | Descrição |
|--------|------|-----------|
| POST | /auth/register-company | Cria tenant + admin |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Logout |
| GET | /auth/me | Usuário atual |

## Company

| GET | /companies/me | Org atual |
| GET | /companies/me/members | Lista membros |
| POST | /companies/me/members | Adicionar membro (ADMIN) |
| PATCH | /members/:id | Atualizar membro |
| DELETE | /members/:id | Remover membro |

## Plans

| GET | /plans | Listar planos |

## Projects

| CRUD | /projects | Projetos do tenant |

## Work Items

| CRUD | /projects/:id/work-items | Backlog |
| GET | /projects/:id/work-items/tree | Árvore hierárquica |
| PATCH | /work-items/:id/move | Mover status/posição/sprint |

## Board

| GET | /projects/:id/board | Colunas + items |
| CRUD | /projects/:id/board/columns | Colunas |

## Sprint

| CRUD | /projects/:id/sprints | Sprints |
| GET | /sprints/:id/metrics | Burndown, velocity |

## Release

| CRUD | /projects/:id/releases | Releases |

## QA

| CRUD | /projects/:id/test-plans | Planos de teste |
| CRUD | /test-plans/:id/cases | Casos de teste |
| POST | /test-cases/:id/executions | Executar |
| GET | /projects/:id/traceability | Matriz |
