FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DIRECT_CONNECTOR_PORT=8787
EXPOSE 8787

CMD ["npm", "run", "server"]
