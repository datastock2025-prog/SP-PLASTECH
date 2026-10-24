FROM docker.io/library/node:22-alpine

WORKDIR /workspace
COPY package.json ./
RUN npm install --legacy-peer-deps

EXPOSE 3000
CMD ["npm", "run", "dev"]
