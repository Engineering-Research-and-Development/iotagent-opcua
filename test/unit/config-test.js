/*
 * Copyright 2019 -  Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opc-ua
 *
 */
const config = {};

config.mqtt = {
  host: 'localhost',
  port: 1883,
  username: 'guest',
  password: 'guest',
};

config.http = {
  port: 7896,
};

config.amqp = {
  host: 'localhost',
  port: 5672,
  exchange: 'amq.topic',
  queue: 'iota_queue',
  options: { durable: true },
};

config.iota = {
  logLevel: 'FATAL',
  contextBroker: {
    host: '192.168.1.1',
    port: '1026',
  },
  server: {
    port: 4041,
  },
  deviceRegistry: {
    type: 'memory',
  },
  types: {},
  service: 'howtoService',
  subservice: '/howto',
  providerUrl: 'http://localhost:4041',
  deviceRegistrationDuration: 'P1M',
  defaultType: 'Thing',
  defaultResource: '/iot/d',
};

config.defaultKey = '1234';
config.defaultTransport = 'MQTT';

module.exports = config;
