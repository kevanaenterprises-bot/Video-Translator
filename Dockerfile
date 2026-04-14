FROM node:22-alpine

WORKDIR /app

# Build the frontend from client/ folder (matches railway.toml config)
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy client/ source
COPY client/ ./client/
COPY attached_assets/ ./attached_assets/
COPY public/ ./public/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY index.html ./
RUN cd client && npm run build --legacy-peer-deps

# Start the server
CMD ["npm", "run", "start"]
