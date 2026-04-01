FROM node:20-bullseye-slim

# Install build tools needed for better-sqlite3 native module
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install ALL dependencies (dev included — needed for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start production server
ENV NODE_ENV=production
CMD ["node", "dist/index.cjs"]
