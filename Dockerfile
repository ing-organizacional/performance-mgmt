FROM node:22-alpine AS base

# Update npm to latest version
RUN npm install -g npm@11.5.2

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY .yarnrc.yml ./
COPY .yarn .yarn/
RUN \
  if [ -f yarn.lock ]; then yarn install --immutable; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Use UnRAID standard user/group IDs for better compatibility
# GID 100 (users) already exists in Alpine, so use it directly
RUN adduser --system --uid 99 --ingroup users nextjs

# Copy the public folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:users .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:users /app/.next/standalone ./
COPY --from=builder --chown=nextjs:users /app/.next/static ./.next/static

# Copy Prisma files with proper ownership
COPY --from=builder --chown=nextjs:users /app/prisma ./prisma
COPY --from=builder --chown=nextjs:users /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:users /app/node_modules/@prisma ./node_modules/@prisma

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:users /app/data && chmod -R 775 /app/data

# Fix ownership of entire /app directory for the nextjs user
# This allows package installation, yarn.lock creation, and other write operations
RUN chown -R nextjs:users /app

# Create startup script for proper database initialization (before switching user)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Setting up database permissions..."' >> /app/start.sh && \
    echo 'mkdir -p /app/data' >> /app/start.sh && \
    echo 'chmod 775 /app/data' >> /app/start.sh && \
    echo 'echo "Initializing database schema..."' >> /app/start.sh && \
    echo 'npx prisma db push' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:users /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/production.db"

# Run the startup script
CMD ["/app/start.sh"]