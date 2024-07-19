FROM node:20.11-alpine AS builder
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:${SERVICE}

FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
USER node
EXPOSE ${PORT}
CMD ["sh", "-c", "npm run start:users"]