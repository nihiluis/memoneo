FROM --platform=$BUILDPLATFORM node:24-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY frontend/ ./
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @memoneo/shared exec tsc -p tsconfig.json
# Released images use the browser's current origin for /api and /auth.
ENV NODE_ENV=production
ENV EXPO_NO_DOTENV=1
ENV EXPO_PUBLIC_API_BASE_URL=""
ENV EXPO_PUBLIC_AUTH_BASE_URL=""
RUN pnpm build:app:web

FROM nginx:stable-alpine
COPY --from=builder /app/apps/app/dist /usr/share/nginx/html
COPY deploy/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -q --spider http://127.0.0.1/ || exit 1
