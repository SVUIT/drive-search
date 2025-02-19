FROM node:23.8-bookworm-slim

WORKDIR /home

COPY public/* .

RUN npm install --only-production

EXPOSE 3000

CMD ["node", "server.js"]