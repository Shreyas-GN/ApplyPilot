# syntax=docker/dockerfile:1
FROM node:22-slim AS base
WORKDIR /repo
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/workers/package.json apps/workers/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/extension/package.json apps/extension/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/validators/package.json packages/validators/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @applypilot/api prisma:generate
RUN pnpm --filter @applypilot/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api ./apps/api
COPY --from=build /repo/packages ./packages
WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
