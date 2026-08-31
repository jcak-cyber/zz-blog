FROM node:20-alpine AS deps
WORKDIR /app
# 国内构建：Corepack / pnpm 走 npmmirror；lockfile 里的 npmjs tarball 也要改写
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=https://registry.npmmirror.com
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backEnd/package.json apps/backEnd/
RUN printf 'registry=https://registry.npmmirror.com\n' > .npmrc \
  && if [ -f pnpm-lock.yaml ]; then \
       sed -i 's#https://registry.npmjs.org#https://registry.npmmirror.com#g' pnpm-lock.yaml; \
     fi
RUN pnpm install --filter @zz-blog/backend...

FROM node:20-alpine AS build
WORKDIR /app
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=https://registry.npmmirror.com
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backEnd/node_modules ./apps/backEnd/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/backEnd ./apps/backEnd
WORKDIR /app/apps/backEnd
RUN pnpm prisma generate && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app/apps/backEnd
ENV NODE_ENV=production
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
COPY --from=build /app/apps/backEnd/dist ./dist
COPY --from=build /app/apps/backEnd/package.json ./
COPY --from=build /app/apps/backEnd/prisma ./prisma
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backEnd/node_modules ./node_modules
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
