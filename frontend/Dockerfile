# Multi-stage build for React frontend
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Change ownership to node user
RUN chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# Build stage
FROM base AS build

# Install dependencies
RUN npm ci

# Accept build arguments
ARG REACT_APP_API_URL=http://localhost:3001/api
ARG REACT_APP_UPLOAD_URL=http://localhost:3001

# Set environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_UPLOAD_URL=$REACT_APP_UPLOAD_URL

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - Use serve to serve the built files
FROM node:18-alpine AS production

# Install serve globally
RUN npm install -g serve

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Create app directory
WORKDIR /app

# Copy built app from build stage
COPY --from=build --chown=nextjs:nodejs /app/build ./build

# Create a simple health check endpoint using serve
RUN echo '#!/bin/sh\nserve -s build -l 80 &\nSERVE_PID=$!\nwhile true; do\n  if ! kill -0 $SERVE_PID 2>/dev/null; then\n    echo "Serve process died, exiting"\n    exit 1\n  fi\n  sleep 30\ndone' > /app/start.sh && \
    chmod +x /app/start.sh

# Switch to app user
USER nextjs

# Add labels
LABEL maintainer="Challenger Team"
LABEL description="Challenger Frontend - Social Media Challenge Platform"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start the application
CMD ["serve", "-s", "build", "-l", "80"]
