FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port
USER root
RUN mkdir -p /home/node/dist/${SERVICE}/node_modules && \
    chown -R node:node /home/node
ENV NPM_CONFIG_CACHE /tmp/npm-cache
RUN mkdir -p $NPM_CONFIG_CACHE && \
    chmod -R 777 $NPM_CONFIG_CACHE
USER node
WORKDIR /home/node/dist/${SERVICE}
COPY --chown=node package*.json ./
RUN mkdir -p node_modules && \
    npm ci --only=production && \
    npm cache clean --force && \
    rm -rf $NPM_CONFIG_CACHE
COPY --chown=node . .
RUN npm run build:${SERVICE} && \
    npm prune --production
EXPOSE ${PORT}
RUN npm cache clean --force && \
    rm -rf $NPM_CONFIG_CACHE && \
    rm -rf /tmp/*
CMD ["sh", "-c", "npm run start:users"]
ARG CACHEBUST=1
