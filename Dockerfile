# One image: builds the React storefront, then runs the Express API which also
# serves the storefront with server-rendered SEO tags and Open Graph images.

FROM node:22-slim AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/src ./src
COPY --from=client /client/dist ./public
ENV NODE_ENV=production CLIENT_DIST=/app/public PORT=4000
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-if-empty.js && node src/index.js"]
