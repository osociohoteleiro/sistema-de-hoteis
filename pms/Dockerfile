# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files 
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set production environment for build
ENV NODE_ENV=production

# Copy production environment file and rename to .env for Vite
COPY .env.production .env

# Ensure Vite uses the production environment variables by setting them explicitly
ENV VITE_API_BASE_URL=https://osh-sistemas-api-backend.d32pnk.easypanel.host/api
ENV VITE_SOCKET_URL=https://osh-sistemas-api-backend.d32pnk.easypanel.host

# Build arguments for environment variables (override if provided)
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL

# Debug: Show environment variables being used
RUN echo "=== Environment Variables ===" && \
    echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" && \
    echo "VITE_SOCKET_URL=$VITE_SOCKET_URL" && \
    echo "Contents of .env file:" && \
    cat .env && \
    echo "=== End Debug ==="

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install wget for health check
RUN apk add --no-cache wget

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx (runs as root by default, which is fine for containers)
CMD ["nginx", "-g", "daemon off;"]