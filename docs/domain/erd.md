# ERD — Modelo de domínio

```mermaid
erDiagram
    Company ||--|| Subscription : has
    Plan ||--o{ Subscription : defines
    Company ||--o{ Member : has
    User ||--o{ Member : belongs
    Company ||--o{ Project : owns
    Project ||--o{ Release : has
    Project ||--o{ Sprint : has
    Project ||--o{ WorkItem : contains
    Project ||--o{ BoardColumn : defines
    WorkItem ||--o{ WorkItem : parent
    WorkItem ||--o{ WorkItemLink : links
    Sprint ||--o{ WorkItem : contains
    Release ||--o{ WorkItem : targets
    WorkItem ||--o{ TestCase : story
    TestCase ||--o{ TestExecution : has
    TestExecution ||--o{ TestEvidence : has
    TestExecution ||--o{ WorkItem : defect
    Company ||--o{ AuditLog : tracks
```

## Tabelas principais

- **Company, Plan, Subscription, User, Member**
- **Project, Release, Sprint, BoardColumn**
- **WorkItem** (type + parentId hierárquico)
- **WorkItemLink** (relates, blocks, duplicates)
- **TestPlan, TestCase, TestExecution, TestEvidence**
- **AuditLog, RefreshToken**
