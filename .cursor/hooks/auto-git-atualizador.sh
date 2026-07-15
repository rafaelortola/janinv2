#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${CURSOR_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  STATUS=$(echo "$INPUT" | jq -r '.status // "completed"')
else
  STATUS="completed"
  if echo "$INPUT" | grep -q '"status"[[:space:]]*:[[:space:]]*"aborted"'; then
    STATUS="aborted"
  elif echo "$INPUT" | grep -q '"status"[[:space:]]*:[[:space:]]*"error"'; then
    STATUS="error"
  fi
fi

if [ "$STATUS" != "completed" ]; then
  echo '{}'
  exit 0
fi

has_changes() {
  ! git diff --quiet 2>/dev/null ||
    ! git diff --cached --quiet 2>/dev/null ||
    [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]
}

if ! has_changes; then
  echo '{}'
  exit 0
fi

printf '%s\n' '{"followup_message":"/git-atualizador commitar e enviar todas as alterações pendentes ao repositório remoto"}'
