# Production Dockerfile for Next.js with shadcn/ui
# Uses prebuilt base image for faster builds

# Build stage - uses base image with node_modules pre-installed
ARG BASE_IMAGE=node:20-slim
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install/update dependencies
# If base image has node_modules, npm install only adds new packages (fast)
# If no node_modules, does full install (slower but still works)
RUN npm install

# Copy source code
COPY . .

# Ensure standalone output is enabled
RUN if ! grep -q "output.*standalone" next.config.js 2>/dev/null && \
       ! grep -q "output.*standalone" next.config.mjs 2>/dev/null; then \
      if [ -f next.config.js ]; then \
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.js || true; \
      elif [ -f next.config.mjs ]; then \
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.mjs || true; \
      fi; \
    fi

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Create public folder if it doesn't exist
RUN mkdir -p public

# Production image - minimal runtime (reuse base image to avoid re-downloading node)
FROM ${BASE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server (includes server.js and node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next-build/standalone ./
# Copy static files to .next/static (required path for standalone server)
COPY --from=builder --chown=nextjs:nodejs /app/.next-build/static ./.next-build/static
# Copy public folder
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
