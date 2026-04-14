FROM node:22-alpine

WORKDIR /app

# Build from root (matches railway.toml)
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy all source files
COPY client/ ./client/
COPY attached_assets/ ./attached_assets/
COPY public/ ./public/
COPY server/ ./server/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# Build BOTH client AND server (like working version)
RUN npm run build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Start the Express server (not static server!)
CMD ["sh", "-c", "NODE_ENV=production node dist/index.js"]
