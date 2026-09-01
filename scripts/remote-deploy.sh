#!/usr/bin/env bash
# 在服务器上执行：同步仓库 + 拉取 GHCR 镜像并更新容器
# CI：ssh 后执行 bash scripts/remote-deploy.sh
# 手动：cd ~/zz-blog && bash scripts/remote-deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_TAG="${IMAGE_TAG:-latest}"
GHCR_OWNER="${GHCR_OWNER:-jcak-cyber}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

if [[ ! -f .env ]]; then
  echo "[deploy] missing .env in ${ROOT_DIR}" >&2
  exit 1
fi

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
  COMPOSE=(docker compose)
elif command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker)
  COMPOSE=(sudo docker compose)
else
  echo "[deploy] cannot talk to docker daemon" >&2
  exit 1
fi

# 私有 GHCR 包：优先用环境变量，否则读 ~/.ghcr_token
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "${GHCR_TOKEN}" | "${DOCKER[@]}" login ghcr.io -u "${GHCR_USER:-${GHCR_OWNER}}" --password-stdin
elif [[ -f "${HOME}/.ghcr_token" ]]; then
  tr -d '\r\n' <"${HOME}/.ghcr_token" | "${DOCKER[@]}" login ghcr.io -u "${GHCR_USER:-${GHCR_OWNER}}" --password-stdin
fi

if [[ -d .git ]]; then
  echo "[deploy] syncing git origin/${DEPLOY_BRANCH}"
  git fetch origin
  git reset --hard "origin/${DEPLOY_BRANCH}"
fi

export IMAGE_TAG GHCR_OWNER
echo "[deploy] pull ${GHCR_OWNER} tag=${IMAGE_TAG}"
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" pull

echo "[deploy] up"
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" up -d --remove-orphans
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" ps
echo "[deploy] done"
