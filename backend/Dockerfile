FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Debugging step: Print the contents of init.sql to the build log
RUN echo "--- DEBUG: Contents of init.sql ---" && cat src/config/init.sql && echo "--- END DEBUG ---"

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/config ./src/config
