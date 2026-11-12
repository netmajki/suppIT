#!/usr/bin/env bash
# Kopia zapasowa bazy i wgranych plików (uruchamiać na VPS w katalogu projektu).
# Cron, codziennie o 3:15:  15 3 * * * cd /opt/suppit && ./scripts/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec -T db pg_dump -U suppit -d suppit --clean --if-exists | gzip > "backups/db-$STAMP.sql.gz"
docker compose run --rm --no-deps -v "$PWD/backups:/backup" --entrypoint sh app -c "tar czf /backup/uploads-$STAMP.tar.gz -C /app uploads"
# zachowaj 14 ostatnich kopii każdego rodzaju
ls -1t backups/db-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
ls -1t backups/uploads-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --
echo "$(date -Is) backup OK: $STAMP"
