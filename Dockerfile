# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build and run backend + serve frontend
FROM node:20-alpine
WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ .
COPY --from=frontend /app/dist ./public

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node prisma/seed.js; node src/index.js"]
