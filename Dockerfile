FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app

# Install curl and ca-certificates for downloading mmseqs2
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install mmseqs2 (architecture-aware)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then ARCHIVE="mmseqs-linux-avx2.tar.gz"; \
    elif [ "$ARCH" = "aarch64" ]; then ARCHIVE="mmseqs-linux-arm64.tar.gz"; \
    else echo "Unsupported arch: $ARCH" && exit 1; fi && \
    curl -fsSL "https://github.com/soedinglab/MMseqs2/releases/latest/download/${ARCHIVE}" | tar xz && \
    mv mmseqs/bin/mmseqs /usr/local/bin/mmseqs && \
    rm -rf mmseqs

# Install express (only production dependency needed at runtime)
COPY package.json ./
RUN npm install express

# Copy built assets, server, and solubility database
COPY --from=builder /app/dist ./dist
COPY server.js sol.fasta ./

EXPOSE 3000
CMD ["node", "server.js"]
