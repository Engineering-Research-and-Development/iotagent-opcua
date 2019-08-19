ARG  NODE_VERSION=8.16.1-stretch
FROM node:${NODE_VERSION}

MAINTAINER Engineering Ingegneria Informatica spa - Research and Development Lab

WORKDIR /opt

RUN \
  apt-get update && \
  apt-get install -y git netcat openjdk-8-jdk-headless && \
  git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua.git" && \
  cd /opt/iotagent-opcua && \
  npm install && \
  rm -rf /root/.npm/cache/* && \
  rm -rf docs && \
  rm -rf docker-compose && \
  rm -f Dockerfile && \
  # Clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove

VOLUME /opt/iotagent-opcua/conf

WORKDIR /opt/iotagent-opcua

# Expose 4041 for NORTH PORT
EXPOSE ${IOTA_NORTH_PORT:-4041}

COPY docker-entrypoint.sh entrypoint.sh

ENTRYPOINT ./entrypoint.sh
