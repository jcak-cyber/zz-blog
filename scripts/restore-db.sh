#!/usr/bin/env bash
# 从备份恢复 Postgres（会覆盖当前库数据，慎用）
# 用法：
#   bash scripts/restore-db.sh ~/backups/zz-blog/zzblog-20260101-120000.sql.gz

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_FILE="${1:-}"
if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "用法: bash scripts/restore-db.sh <backup.sql.gz>" >&2
  exit 1
fi

POSTGRES_USER="${POSTGRES_USER:-zzblog}"
POSTGRES_DB="${POSTGRES_DB:-zzblog}"
if [[ -f .env ]]; then
  POSTGRES_USER="$(grep -E '^POSTGRES_USER=' .env | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  POSTGRES_DB="$(grep -E '^POSTGRES_DB=' .env | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  POSTGRES_USER="${POSTGRES_USER:-zzblog}"
  POSTGRES_DB="${POSTGRES_DB:-zzblog}"
fi

if docker info >/dev/null 2>&1; then
  DOCKER=(docker compose)
elif command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker compose)
else
  echo "cannot talk to docker daemon" >&2
  exit 1
fi

echo "[restore] WARNING: will overwrite database ${POSTGRES_DB}"
echo "[restore] file=${BACKUP_FILE}"
read -r -p "输入 yes 继续: " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "[restore] cancelled"
  exit 0
fi

# 断开连接后重建库再导入
"${DOCKER[@]}" exec -T postgres \
  psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "${POSTGRES_DB}";
CREATE DATABASE "${POSTGRES_DB}" OWNER "${POSTGRES_USER}";
SQL

gzip -dc "$BACKUP_FILE" | "${DOCKER[@]}" exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "[restore] done"
