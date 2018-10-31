FROM centos:centos7

MAINTAINER Engineering Ingegneria Informatica spa - Research and Development Lab

WORKDIR /opt

RUN \
    yum install -y epel-release && \
    yum update -y epel-release && \
    yum install -y git bzip2 nc git tar which iputils net-tools openssl java-1.8.0-openjdk-headless && \
    yum install -y nodejs npm --enablerepo=epel && \
    yum clean all && rm -rf /var/lib/yum/yumdb && rm -rf /var/lib/yum/history

RUN \
    git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua.git" && \
    cd /opt/iotagent-opcua && \
    npm install && \
    rm -rf /root/.npm/cache/*

VOLUME /opt/iotagent-opcua/conf

WORKDIR /opt/iotagent-opcua

ENTRYPOINT node index.js