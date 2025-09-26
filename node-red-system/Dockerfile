FROM nodered/node-red:latest

WORKDIR /data

COPY package.json flows.json ./

RUN npm install --unsafe-perm --no-update-notifier --no-fund --only=production
