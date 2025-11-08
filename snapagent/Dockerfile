FROM node:20-alpine

# Install Agentuity CLI globally
RUN npm install -g @agentuity/cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Bundle the application
RUN agentuity bundle

# Expose port
EXPOSE 3500

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3500

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3500', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "--env-file", ".env", "--no-deprecation", ".agentuity/index.js"]
