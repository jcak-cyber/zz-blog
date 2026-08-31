FROM node:20-alpine AS deps
WORKDIR /app
# 国内构建：Corepack / pnpm 走 npmmirror；lockfile 里的 npmjs tarball 也要改写
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=https://registry.npmmirror.com
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/frontEnd/package.json apps/frontEnd/
RUN printf 'registry=https://registry.npmmirror.com\n' > .npmrc \
  && if [ -f pnpm-lock.yaml ]; then \
       sed -i 's#https://registry.npmjs.org#https://registry.npmmirror.com#g' pnpm-lock.yaml; \
     fi
RUN pnpm install --filter @zz-blog/frontend...

FROM node:20-alpine AS build
WORKDIR /app
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=https://registry.npmmirror.com
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
# rewrite 在 build 时写入，Docker 内网指向 backend 服务名
ARG BACKEND_URL=http://backend:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV BACKEND_URL=$BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontEnd/node_modules ./apps/frontEnd/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/frontEnd ./apps/frontEnd
WORKDIR /app/apps/frontEnd
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# 注意：目录名是 frontEnd（驼峰），不要改成 frontend
COPY --from=build /app/apps/frontEnd/.next/standalone ./
COPY --from=build /app/apps/frontEnd/.next/static ./apps/frontEnd/.next/static
COPY --from=build /app/apps/frontEnd/public ./apps/frontEnd/public
EXPOSE 3000
# 兼容不同 standalone 布局；优先使用真实目录名 frontEnd
CMD ["sh", "-c", "if [ -f apps/frontEnd/server.js ]; then exec node apps/frontEnd/server.js; elif [ -f apps/frontend/server.js ]; then exec node apps/frontend/server.js; elif [ -f server.js ]; then exec node server.js; else echo 'server.js not found' && find /app -name server.js -print && exit 1; fi"]
