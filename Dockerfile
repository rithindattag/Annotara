# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY server ./
RUN npm run build
CMD ["npm", "run", "start"]
