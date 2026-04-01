FROM node:20-slim

# Install build tools needed for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port (Railway sets PORT env var automatically)
EXPOSE 5000

# Start production server
CMD ["node", "dist/index.cjs"]
