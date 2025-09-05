FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.PORT || 3001, path: '/health', timeout: 2000 }; \
    const request = http.request(options, (res) => { \
    if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }); \
    request.on('error', () => process.exit(1)); \
    request.on('timeout', () => process.exit(1)); \
    request.end();"

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]