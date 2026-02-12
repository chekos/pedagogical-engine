FROM node:22-alpine

RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

COPY package.json package-lock.json* ./
COPY src/server/package.json ./src/server/
COPY src/frontend/package.json ./src/frontend/

RUN npm install

COPY . .

RUN npm run build --workspace=src/server

EXPOSE 3000

CMD ["node", "src/server/dist/index.js"]
