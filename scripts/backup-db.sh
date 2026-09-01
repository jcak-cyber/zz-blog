#!/usr/bin/env bash
# 备份 Postgres（Docker Compose）
# 用法（在项目根目录）：
#   bash scripts/backup-db.sh
# 环境变量（可选）：
#   BACKUP_DIR   备份目录，默认 ~/backups/zz-blog
#   KEEP_DAYS    保留天数，默认 14

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/zz-blog}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/zzblog-${STAMP}.sql.gz"

# 从 .env 读取库名/用户（没有则用默认）
POSTGRES_USER="${POSTGRES_USER:-zzblog}"
POSTGRES_DB="${POSTGRES_DB:-zzblog}"
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  # 只加载我们需要的键，避免执行奇怪内容
  POSTGRES_USER="$(grep -E '^POSTGRES_USER=' .env | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  POSTGRES_DB="$(grep -E '^POSTGRES_DB=' .env | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  set +a
  POSTGRES_USER="${POSTGRES_USER:-zzblog}"
  POSTGRES_DB="${POSTGRES_DB:-zzblog}"
fi

mkdir -p "$BACKUP_DIR"

echo "[backup] dumping ${POSTGRES_DB} as ${POSTGRES_USER} -> ${OUT_FILE}"

if command -v docker >/dev/null 2>&1; then
  COMPOSE=(docker compose)
  if ! docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  fi
else
  echo "[backup] docker not found" >&2
  exit 1
fi

# 服务器上常用 sudo；本机有权限则可直接跑
if docker info >/dev/null 2>&1; then
  DOCKER=("${COMPOSE[@]}")
elif command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo "${COMPOSE[@]}")
else
  echo "[backup] cannot talk to docker daemon (try sudo)" >&2
  exit 1
fi

"${DOCKER[@]}" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl \
  | gzip -c >"$OUT_FILE"

SIZE="$(du -h "$OUT_FILE" | awk '{print $1}')"
echo "[backup] ok (${SIZE})"

# 删除过期备份
find "$BACKUP_DIR" -type f -name 'zzblog-*.sql.gz' -mtime +"${KEEP_DAYS}" -print -delete \
  | sed 's/^/[backup] removed /' || true

echo "[backup] done. dir=${BACKUP_DIR}"
