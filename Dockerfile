# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install all deps (including dev)
RUN npm install

# Copy source code
COPY . .

# Build TS project
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy build output from builder
COPY --from=builder /app/dist ./dist

# Expose port (if your server uses 3000, adjust as needed)
EXPOSE 3000

# Run the app
CMD ["node", "dist/server.js"]
