FROM oven/bun:1

WORKDIR /app

# Copy package files first
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY index.ts ./

# Set environment
ENV NODE_ENV=production

# Start the service
CMD ["bun", "run", "index.ts"]
