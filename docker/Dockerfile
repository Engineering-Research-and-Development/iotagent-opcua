# Copyright 2020 Engineering Ingegneria Informatica S.p.A.

ARG  NODE_VERSION=12
FROM node:${NODE_VERSION}-stretch

ARG GITHUB_ACCOUNT=Engineering-Research-and-Development
ARG GITHUB_REPOSITORY=iotagent-opcua
ARG DOWNLOAD=latest
ARG SOURCE_BRANCH=master
ARG NODE_VERSION

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Copying Build time arguments to environment variables so they are persisted at run time and can be 
# inspected within a running container.
# see: https://vsupalov.com/docker-build-time-env-values/  for a deeper explanation.

ENV GITHUB_ACCOUNT=${GITHUB_ACCOUNT}
ENV GITHUB_REPOSITORY=${GITHUB_REPOSITORY}
ENV DOWNLOAD=${DOWNLOAD}

LABEL "maintainer"="Engineering Ingegneria Informatica spa - Research and Development Lab"
LABEL "org.opencontainers.image.authors"=""
LABEL "org.opencontainers.image.documentation"="https://iotagent-opcua.rtfd.io/"
LABEL "org.opencontainers.image.vendor"="Engineering Ingegneria Informatica spa"
LABEL "org.opencontainers.image.licenses"="AGPL-3.0-only"
LABEL "org.opencontainers.image.title"="IoT Agent for the OPC-UA protocol"
LABEL "org.opencontainers.image.description"="An Internet of Things Agent accepting data from OPC UA devices. This IoT Agent is designed to be a bridge between the OPC Unified Architecture protocol and the NGSI interface of a context broker."
LABEL "org.opencontainers.image.source"="https://github.com/${GITHUB_ACCOUNT}/${GITHUB_REPOSITORY}"
LABEL "org.nodejs.version"="${NODE_VERSION}"

#
# The following RUN command retrieves the source code from GitHub.
# 
# To obtain the latest stable release run this Docker file with the parameters
# --no-cache --build-arg DOWNLOAD=stable
# To obtain any speciifc version of a release run this Docker file with the parameters
# --no-cache --build-arg DOWNLOAD=1.7.0
#
# The default download is the latest tip of the master of the named repository on GitHub
#
# Alternatively for local development, just copy this Dockerfile into file the root of the repository and 
# replace the whole RUN statement by the following COPY statement in your local source using :
#
# COPY . /opt/iotagent-opcua
#
# hadolint ignore=DL3008
RUN \
  # Ensure that unzip is installed prior to downloading
  apt-get install -y --no-install-recommends unzip && \
  if [ "${DOWNLOAD}" = "latest" ] ; \
  then \
    RELEASE="${SOURCE_BRANCH}"; \
    echo "INFO: Building Latest Development from ${SOURCE_BRANCH} branch."; \
  elif [ "${DOWNLOAD}" = "stable" ]; \
  then \
    RELEASE=$(curl -s https://api.github.com/repos/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/releases/latest | grep 'tag_name' | cut -d\" -f4); \
    echo "INFO: Building Latest Stable Release: ${RELEASE}"; \
  else \
    RELEASE="${DOWNLOAD}"; \
    echo "INFO: Building Release: ${RELEASE}"; \
  fi && \
  RELEASE_CONCAT=$(echo "${RELEASE}" | tr / -); \
  curl -s -L https://github.com/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/archive/"${RELEASE}".zip > source.zip && \
  unzip source.zip -x "*/test/**" "*/rpm/**" "*/ghpages/**" "*/docs/**" "*/.*" && \
  rm source.zip && \
  mv "${GITHUB_REPOSITORY}-${RELEASE_CONCAT}" /opt/iotagent-opcua && \
  # Remove unzip and clean apt cache
  apt-get clean && \
  apt-get remove -y unzip && \
  apt-get -y autoremove && \
  rm -rf /var/lib/apt/lists/* 


WORKDIR /opt/iotagent-opcua

# hadolint ignore=DL3008
RUN \
  apt-get update && \
  apt-get install --no-install-recommends -y git netcat openjdk-8-jdk-headless && \
  npm install pm2@3.2.2 -g && \
  echo "INFO: npm install --production..." && \
  npm install --production && \
  # Clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove  && \
  rm -rf /var/lib/apt/lists/* && \
  chown node:node -R . && \
  chmod +x docker/entrypoint.sh

USER node

ENV NODE_ENV=production

VOLUME /opt/iotagent-opcua/conf

# Expose 4041 for NORTH PORT
EXPOSE ${IOTA_NORTH_PORT:-4041}

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["-- ", "config.js"]
