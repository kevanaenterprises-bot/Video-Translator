FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy all source files needed for both Vite and server compilation
COPY client/ ./client/
COPY attached_assets/ ./attached_assets/
COPY public/ ./public/
COPY server/ ./server/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY index.html ./
COPY build-server.mjs ./

# Builds frontend → dist/public/ and server → dist/index.js
RUN npm run build --legacy-peer-deps

CMD ["node", "dist/index.js"]
