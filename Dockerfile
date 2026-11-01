# =======================================================
# PlacementHub — Complete Cloud-Native Production Image
# Frontend + Backend unified single container
# =======================================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Generate Prisma
FROM node:20-alpine AS backend-builder
WORKDIR /build/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY backend/ ./

# Stage 3: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy backend files
COPY --from=backend-builder /build/backend /app

# Copy built frontend assets to where backend expects them
COPY --from=frontend-builder /build/frontend/dist /app/../frontend/dist

EXPOSE 4000

CMD ["node", "src/index.js"]
