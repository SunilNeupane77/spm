# Dockerfile for Next.js app
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production image
FROM node:20-alpine AS prod
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=base /app/package.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/next.config.mjs ./next.config.mjs
COPY --from=base /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=base /app/tailwind.config.js ./tailwind.config.js
COPY --from=base /app/globals.css ./globals.css
COPY --from=base /app/app ./app
COPY --from=base /app/components ./components
COPY --from=base /app/lib ./lib
COPY --from=base /app/models ./models
COPY --from=base /app/public ./public
COPY --from=base /app/.env.local ./.env.local

EXPOSE 3000
CMD ["npm", "start"]
