FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci
RUN npm run prisma:generate

COPY backend ./backend
COPY src ./src

ENV NODE_ENV=production
ENV API_PORT=8080

EXPOSE 8080

CMD ["npm", "run", "api:start"]
