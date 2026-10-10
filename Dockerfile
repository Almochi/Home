# ---------- 构建阶段 ----------
FROM node:22-alpine AS builder
WORKDIR /app

# 只拷贝依赖清单，最大化利用层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---------- 运行阶段 ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g http-server
COPY --from=builder /app/dist ./dist
EXPOSE 12445
# -g 让 http-server 对响应做 gzip 压缩（构建产物不再预生成 .gz），-c-1 关闭缓存以便更新即时生效
CMD ["http-server", "dist", "-p", "12445", "-g", "-c-1"]
