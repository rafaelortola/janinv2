# Licenciamento

## Planos seed

| Plano | seatLimit |
|-------|-----------|
| Team 5 | 5 |
| Team 10 | 10 |
| Team 25 | 25 |
| Team 50 | 50 |

## Fluxo

1. Admin escolhe plano no registro
2. Sistema cria Company + Subscription(seatLimit) + Member(ADMIN)
3. seatsUsed = 1
4. Admin cadastra membros até seatLimit

## Erros

- `403 SEAT_LIMIT_REACHED` — limite atingido
- `403 FORBIDDEN` — MEMBER tentando gerenciar seats
