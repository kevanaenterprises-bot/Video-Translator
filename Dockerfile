FROM node:22-alpine

WORKDIR /app

# Install dependencies with legacy-peer-deps to handle Three.js conflict
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build --legacy-peer-deps

# Start the server
CMD ["npm", "run", "start"]
