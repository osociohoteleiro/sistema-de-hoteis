# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files 
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set production environment for build
ENV NODE_ENV=production

# Environment variables will be provided by EasyPanel via "Create .env" option
# No need to copy or set them manually here

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