# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy hotel-app package files first for better caching
COPY hotel-app/package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy hotel-app source code
COPY hotel-app/ ./

# Build arguments for environment variables (EasyPanel compatible)
ARG VITE_API_URL
ARG VITE_APP_NAME="Hotel OSH"
ARG VITE_APP_VERSION="1.0.0"

# Set environment variables
ENV VITE_API_URL=${VITE_API_URL:-https://api.seu-dominio.com/api}
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Remove source maps and dev files for production
RUN find /app/dist -name "*.map" -type f -delete

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration from hotel-app
COPY hotel-app/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]