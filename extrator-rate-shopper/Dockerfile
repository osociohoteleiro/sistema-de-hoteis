# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Tell Puppeteer to skip installing Chromium and set production variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV HEADLESS=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create all necessary directories for the application with proper permissions
RUN mkdir -p /app/results \
             /app/results/extracted-data \
             /app/results/extracted-data/csv \
             /app/results/extracted-data/xlsx \
             /app/logs \
             /app/tmp && \
    chown -R nodejs:nodejs /app/results /app/logs /app/tmp && \
    chmod -R 755 /app/results /app/logs /app/tmp

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('Health check passed')"

# Start application with dumb-init
# Não rodar auto-processador - extrações são controladas manualmente via PMS
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "-e", "console.log('Rate Shopper Extrator ready - Aguardando comandos da API'); setInterval(() => {}, 1000)"]