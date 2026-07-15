# Rastreabilidade

## Cadeia principal

```
Story → Sprint → Release → Build
Story → TestCase → TestExecution → Defect (WorkItem type=DEFECT)
```

## Consultas

| Pergunta | Query |
|----------|-------|
| US em qual Release? | workItem.sprint.release |
| Test cases da US? | testCases WHERE storyId |
| Defects da execução? | workItems WHERE type=DEFECT AND sourceExecutionId |
| Entregue? | release.status = DELIVERED |

## Matriz

View cruzando Story × TestCase × Execution × Defect com status de cobertura.
