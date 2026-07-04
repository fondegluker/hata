# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/yarn.lock* frontend/package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps || yarn install || true

# Copy source
COPY frontend/ .

# Build
RUN npm run build --legacy-peer-deps || yarn build || npm run build

# Production image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
