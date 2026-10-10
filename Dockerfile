FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY app ./app

EXPOSE 3000

CMD ["node", "app/server.js"]
