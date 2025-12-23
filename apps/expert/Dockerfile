# Base image
FROM node:22-alpine AS base

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

WORKDIR /app

# Install OpenSSL (Latest version, compatible with Prisma)
RUN apk add --no-cache openssl



# Setup build stage
FROM base AS builder
COPY . ./
RUN pnpm install -g turbo
RUN pnpm install
RUN pnpm build --filter=@adh/expert...

# Generate Prisma Client with the correct binary target
RUN pnpm prisma generate --schema=./packages/db/prisma/schema.prisma

# Production image
FROM base AS runner
WORKDIR /app

# Install OpenSSL in the final image
RUN apk add --no-cache openssl



# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/apps/expert/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/expert/.next/static ./apps/expert/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/expert/public ./apps/expert/public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Set environment variables
ENV PORT=8000
EXPOSE 8000

CMD ["node", "apps/expert/server.js"]