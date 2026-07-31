FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backEnd/package.json apps/backEnd/
RUN pnpm install --filter @zz-blog/backend...

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backEnd/node_modules ./apps/backEnd/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/backEnd ./apps/backEnd
WORKDIR /app/apps/backEnd
RUN pnpm prisma generate && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app/apps/backEnd
ENV NODE_ENV=production
COPY --from=build /app/apps/backEnd/dist ./dist
COPY --from=build /app/apps/backEnd/package.json ./
COPY --from=build /app/apps/backEnd/prisma ./prisma
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backEnd/node_modules ./node_modules
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
