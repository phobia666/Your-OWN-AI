FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install && cd ..

# Copy source code
COPY server ./server
COPY client/src ./client/src
COPY client/index.html ./client/
COPY client/vite.config.js ./client/

# Build React app
RUN cd client && npm run build && cd ..

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
