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

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app/uploads /app/logs

# Set environment variables for production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port (use PORT environment variable or default to 3001)
EXPOSE 3001

# Health check (use PORT environment variable)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port=process.env.PORT||3001; require('http').get(\`http://localhost:\${port}/api/health\`, (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]