# Multi-stage build for Node.js backend
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Copy source code
COPY . .

# Change ownership to node user
RUN chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Default command for development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Set environment to production
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Copy source code
COPY . .

# Remove development files
RUN rm -rf .git .gitignore README.md docker* *.md

# Change ownership to node user
RUN chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
