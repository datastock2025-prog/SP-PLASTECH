FROM docker.io/library/node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:dev"]
