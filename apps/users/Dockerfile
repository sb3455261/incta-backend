FROM node:20.11-alpine
ARG port
ARG service
ENV SERVICE=$service
ENV PORT=$port

USER root

RUN mkdir -p /home/node/dist/${SERVICE} && \
    chown -R node:node /home/node/dist

USER node

RUN mkdir -p /home/node/dist/${SERVICE}

WORKDIR /home/node/dist/${SERVICE}

COPY --chown=node package*.json ./

RUN npm install

COPY --chown=node . .

RUN npm run build:${SERVICE}

EXPOSE ${PORT}

CMD ["sh", "-c", "npm run start:users"]
