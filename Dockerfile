FROM node:14-alpine AS builder

WORKDIR /app
COPY lib lib
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY server.js server.js
RUN npm install

FROM node:14-alpine
WORKDIR /app
COPY --from=builder /app /app
ENV PORT=8080 CORSANYWHERE_ALLOWLIST="" CORSANYWHERE_RATELIMIT=""
EXPOSE $PORT

# docker build -t cors-anywhere . && docker run cors-anywhere
ENTRYPOINT ["node", "server.js"]
