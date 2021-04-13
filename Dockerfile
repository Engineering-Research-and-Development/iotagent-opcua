# Copyright 2020 Engineering Ingegneria Informatica S.p.A.

ARG  NODE_VERSION=12
FROM node:${NODE_VERSION}

LABEL maintainer="Engineering Ingegneria Informatica spa - Research and Development Lab"

COPY . /opt/iotagent-opcua

WORKDIR /opt/iotagent-opcua

RUN \
  apt-get update && \
  apt-get install -y git netcat openjdk-8-jdk-headless && \
  npm install pm2@3.2.2 -g && \
  echo "INFO: npm install --production..." && \
  npm install --production && \
  # Clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove && \
  chown node:node -R .

USER node

ENV NODE_ENV=production

VOLUME /opt/iotagent-opcua/conf
VOLUME /opt/iotagent-opcua/certificates

# Expose 4001 for NORTH PORT
EXPOSE 4001
# Expose 8080 for REST SERVICES
EXPOSE 8080

CMD [ "node", "index.js" ]
