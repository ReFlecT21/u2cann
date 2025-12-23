FROM node:22-alpine

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

WORKDIR /app

# Setup build stage
COPY . .
RUN pnpm install -g pnpm turbo
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@adh/api...


# Runtime constants
ENV PORT=8000
EXPOSE 8000

CMD ["pnpm", "with-env", "tsx", "apps/api/src/index.ts"]

