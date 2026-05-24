FROM node:24-slim

# Set working directory
WORKDIR /app

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
