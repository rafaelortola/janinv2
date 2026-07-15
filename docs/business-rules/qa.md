# QA — Regras de negócio

## TestPlan

- Um ou mais por Project
- Agrupa TestCases

## TestCase

- Obrigatório link com Story (rastreabilidade)
- Campos: title, steps, expectedResult, priority

## TestExecution

- Status: NOT_RUN, PASS, FAIL, BLOCKED, SKIPPED
- Vinculada a TestCase + Build (opcional) + executor (Member)

## Evidências

- Anexo texto/URL por execução

## Defect

- WorkItem type=DEFECT criado a partir de FAIL
- Auto-link executionId + storyId

## Cobertura

- % stories com ≥1 test case
- % test cases com ≥1 execution

## Matriz

- Grid Story × TestCase com status da última execução
