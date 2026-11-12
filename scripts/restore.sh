#!/usr/bin/env bash
# Przywracanie bazy z kopii: ./scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."
FILE="${1:?Podaj plik kopii, np. backups/db-20260101-031500.sql.gz}"
read -r -p "Nadpisać bieżącą bazę danymi z $FILE? [t/N] " ok
[[ "$ok" == "t" || "$ok" == "T" ]] || exit 1
gunzip -c "$FILE" | docker compose exec -T db psql -U suppit -d suppit
echo "Przywrócono $FILE"
