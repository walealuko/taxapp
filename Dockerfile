FROM node:18-alpine

WORKDIR /app

ARG CACHEBUST=1
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
