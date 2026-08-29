# Mastra audit server, built from the pnpm workspace root so @aso/shared resolves.
FROM node:20-slim AS build
WORKDIR /app

# pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# install deps (workspace-aware)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile=false

# copy sources and build the server
COPY packages/shared packages/shared
COPY apps/server apps/server
COPY tsconfig.base.json ./
RUN pnpm --filter @aso/server build

# ---- runtime image: just the built output + its bundled deps ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Mastra binds to process.env.PORT; Fly sets it to 8080 (see fly.toml).
ENV PORT=8080

# the mastra build emits a self-contained output dir with its own node_modules
COPY --from=build /app/apps/server/.mastra/output ./output

EXPOSE 8080
CMD ["node", "output/index.mjs"]
