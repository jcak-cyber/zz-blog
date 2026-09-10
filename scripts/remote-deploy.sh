#!/usr/bin/env bash
# 在服务器上执行：同步仓库并更新容器
# DEPLOY_MODE=pull（默认）：经国内加速拉取 GHCR 镜像
# DEPLOY_MODE=build：本机 docker compose 构建（走 npmmirror，不依赖 ghcr）
#
# CI：ssh 后执行 bash scripts/remote-deploy.sh
# 手动：cd ~/zz-blog && bash scripts/remote-deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_TAG="${IMAGE_TAG:-latest}"
GHCR_OWNER="${GHCR_OWNER:-jcak-cyber}"
GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.m.daocloud.io}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_MODE="${DEPLOY_MODE:-build}"

mkdir -p logs
LOG_FILE="${ROOT_DIR}/logs/deploy.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "[deploy] ===== $(date -Iseconds) mode=${DEPLOY_MODE} ====="

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

if [[ -d .git ]]; then
  echo "[deploy] syncing git origin/${DEPLOY_BRANCH}"
  git fetch origin
  git reset --hard "origin/${DEPLOY_BRANCH}"
fi

if [[ "${DEPLOY_MODE}" == "build" ]]; then
  echo "[deploy] building from source (npmmirror in Dockerfiles)"
  # 与当前生产一致：沿用已有容器网络/数据卷；构建前后端
  "${COMPOSE[@]}" -f docker-compose.yml up -d --build --remove-orphans
  "${COMPOSE[@]}" -f docker-compose.yml ps
  echo "[deploy] done (build)"
  exit 0
fi

# pull 模式：私有包仍可能需要登录官方 ghcr（加速站一般只缓存公开包）
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "${GHCR_TOKEN}" | "${DOCKER[@]}" login ghcr.io -u "${GHCR_USER:-${GHCR_OWNER}}" --password-stdin || true
elif [[ -f "${HOME}/.ghcr_token" ]]; then
  tr -d '\r\n' <"${HOME}/.ghcr_token" | "${DOCKER[@]}" login ghcr.io -u "${GHCR_USER:-${GHCR_OWNER}}" --password-stdin || true
fi

export IMAGE_TAG GHCR_OWNER GHCR_REGISTRY
echo "[deploy] pull via ${GHCR_REGISTRY}/${GHCR_OWNER} tag=${IMAGE_TAG}"
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" pull

echo "[deploy] up"
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" up -d --remove-orphans
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" ps
echo "[deploy] done (pull)"
