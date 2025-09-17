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

# Install all system dependencies for Puppeteer including security updates
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu \
    ttf-droid \
    ttf-liberation \
    wqy-zenhei \
    dumb-init \
    udev \
    xvfb \
    # Additional dependencies for better Chromium support
    libgcc \
    libstdc++ \
    libx11 \
    libxcomposite \
    libxcursor \
    libxdamage \
    libxext \
    libxfixes \
    libxi \
    libxrandr \
    libxrender \
    libxss \
    libxtst \
    alsa-lib \
    at-spi2-atk \
    at-spi2-core \
    atk \
    cups-libs \
    dbus-libs \
    expat \
    glib \
    gtk+3.0 \
    libdrm \
    libxkbcommon \
    pango \
    wayland-libs-client \
    wayland-libs-server \
    && rm -rf /var/cache/apk/*

# Set Puppeteer environment variables - try multiple possible paths
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV HEADLESS=true
# Try both common Chromium paths in Alpine
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
# Additional environment variables for Chromium
ENV CHROME_DEVEL_SANDBOX=/usr/lib/chromium/chrome_sandbox
ENV DISPLAY=:99

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Verify Chromium installation and create necessary directories
RUN chromium-browser --version || \
    (echo "Chromium not found, trying alternative paths..." && \
     ls -la /usr/bin/chromium* && \
     ls -la /usr/bin/google-chrome* || true)

# Create all necessary directories for the application with proper permissions
RUN mkdir -p /app/results \
             /app/results/extracted-data \
             /app/results/extracted-data/csv \
             /app/results/extracted-data/xlsx \
             /app/logs \
             /app/tmp && \
    chown -R nodejs:nodejs /app/results /app/logs /app/tmp && \
    chmod -R 755 /app/results /app/logs /app/tmp

# Set up Chrome sandbox permissions
RUN chmod 4755 /usr/lib/chromium/chrome_sandbox || \
    chmod 4755 /usr/lib/chromium/chrome-sandbox || \
    echo "Chrome sandbox not found - will use --no-sandbox"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Enhanced health check that also tests Chromium
HEALTHCHECK --interval=30s --timeout=15s --start-period=45s --retries=3 \
  CMD node -e " \
    const { execSync } = require('child_process'); \
    try { \
      execSync('chromium-browser --version', { timeout: 5000 }); \
      console.log('Health check passed - Chromium OK'); \
      process.exit(0); \
    } catch(e) { \
      console.log('Health check failed - Chromium issue:', e.message); \
      process.exit(1); \
    }"

# Start application with auto-processor in production
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "start-production.js"]