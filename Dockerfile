# Stage 1: Build the frontend
FROM node:21-alpine as frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build the backend
FROM node:21-alpine as backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Build and run the app
FROM node:21-alpine
WORKDIR /app
COPY --from=frontend-build /app/public /app/public
COPY --from=backend-build /app/dist /app/dist
COPY backend/package*.json ./
RUN npm ci --only=production
ENV PATH_TO_STATIC=/app/public
EXPOSE 3000

CMD ["node", "/app/dist/index.js"]
