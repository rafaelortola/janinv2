# PRD — Janin v2

## Visão

SaaS multi-tenant de gestão de projetos e QA com rastreabilidade ponta a ponta (Story → Test Case → Execution → Defect → Release), inspirado em Jira/Azure DevOps.

## Personas

| Persona | Necessidade |
|---------|-------------|
| **Admin (contratante)** | Contratar plano, gerenciar seats e equipe |
| **PO** | Backlog, roadmap, releases |
| **DEV** | Tasks, board Kanban, sprints |
| **QA** | Test cases, execuções, defects, matriz de rastreabilidade |
| **Tech Lead** | Visão técnica, spikes, capacity |

## Objetivos MVP

1. Tenant por empresa com licenciamento por seats
2. Backlog hierárquico (Epic → Story → Task...)
3. Kanban com drag-and-drop
4. Sprints com planning e métricas básicas
5. Segurança multi-tenant desde o dia 1

## Objetivos v1.0

- Módulo QA completo
- Roadmap e Releases
- Relatórios e dashboards

## Objetivos v2.0

- Integrações (GitHub, Slack, Jira)
- IA (gerar stories, test cases, BDD)
- Produção Node.js com PM2

## Métricas de sucesso

- Tempo de onboarding < 5 min
- Rastreabilidade Story→Defect em 3 cliques
- Zero vazamento cross-tenant nos testes
