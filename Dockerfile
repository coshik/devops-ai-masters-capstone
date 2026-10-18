FROM node:22-alpine

# Update Alpine packages to obtain available security fixes
RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node app ./app

USER node

EXPOSE 3000

CMD ["node", "app/server.js"]
