FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN  \
  apt-get update && \
  apt-get install -y git netcat openjdk-8-jdk-headless && \
  npm install pm2@3.2.2 -g && \
  echo "INFO: npm install --production..." && \
  npm install --production && \
  # If you are building your code for production
  npm ci --only=production \
  # Clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove && \
  chown node:node -R .

# Bundle app source
COPY . .

ENV NODE_ENV=production

EXPOSE 4001
EXPOSE 8080

CMD [ "node", "index.js" ]
