FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node app ./app

USER node

EXPOSE 3000

CMD ["node", "app/server.js"]

