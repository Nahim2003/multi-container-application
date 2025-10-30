FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev
RUN apk add --no-cache curl
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production 
EXPOSE 3000

CMD ["node", "server.js"]