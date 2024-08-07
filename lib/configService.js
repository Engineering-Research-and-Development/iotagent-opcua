/*
 * Copyright 2022 Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opcua
 *
 * iotagent-opcua is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-opcua is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-opcua.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[manfredi.pistone@eng.it, gabriele.deluca@eng.it, walterdomenico.vergara@eng.it, mattiagiuseppe.marzano@eng.it]
 */

let config = {};
let logger = require('logops');
const iotAgentLib = require('iotagent-node-lib');

function processEnvironmentVariables() {
    const commonVariables = ['CONFIGURATION_TYPE', 'CONFIG_RETRIEVAL', 'DEFAULT_KEY', 'DEFAULT_TRANSPORT'];

    const iotaVariables = [
        'IOTA_LOGLEVEL',
        'IOTA_TIMESTAMP',
        'IOTA_CB_HOST',
        'IOTA_CB_PORT',
        'IOTA_CB_NGSIVERSION',
        'IOTA_CB_NGSILDCONTEXT',
        'IOTA_CB_SERVICE',
        'IOTA_CB_SUBSERVICE',
        'IOTA_NORTH_PORT',
        'IOTA_REGISTRY_TYPE',
        'IOTA_MONGO_HOST',
        'IOTA_MONGO_PORT',
        'IOTA_MONGO_DB',
        'IOTA_SERVICE',
        'IOTA_SUBSERVICE',
        'IOTA_PROVIDER_URL',
        'IOTA_DEVICEREGDURATION',
        'IOTA_DEFAULTTYPE',
        'IOTA_DEFAULTRESOURCE',
        'IOTA_EXPLICITATTRS',
        'IOTA_EXTENDED_FORBIDDEN_CHARACTERS',
        'IOTA_AUTOPROVISION',
        'IOTA_EXPRESS_LIMIT'
    ];

    const opcUAVariables = [
        'IOTA_OPCUA_ENDPOINT',
        'IOTA_OPCUA_SECURITY_MODE',
        'IOTA_OPCUA_SECURITY_POLICY',
        'IOTA_OPCUA_SECURITY_USERNAME',
        'IOTA_OPCUA_SECURITY_PASSWORD',
        'IOTA_OPCUA_UNIQUE_SUBSCRIPTION',
        'IOTA_OPCUA_SUBSCRIPTION_NOTIFICATIONS_PER_PUBLISH',
        'IOTA_OPCUA_SUBSCRIPTION_PUBLISHING_ENABLED',
        'IOTA_OPCUA_SUBSCRIPTION_REQ_LIFETIME_COUNT',
        'IOTA_OPCUA_SUBSCRIPTION_REQ_MAX_KEEP_ALIVE_COUNT',
        'IOTA_OPCUA_SUBSCRIPTION_REQ_PUBLISHING_INTERVAL',
        'IOTA_OPCUA_SUBSCRIPTION_PRIORITY'
    ];

    const protectedVariables = ['IOTA_OPCUA_SECURITY_USERNAME', 'IOTA_OPCUA_SECURITY_PASSWORD'];

    const mappingToolVariables = ['IOTA_OPCUA_MT_POLLING', 'IOTA_OPCUA_MT_AGENT_ID', 'IOTA_OPCUA_MT_ENTITY_ID', 'IOTA_OPCUA_MT_ENTITY_TYPE', 'IOTA_OPCUA_MT_NAMESPACE_IGNORE', 'IOTA_OPCUA_MT_STORE_OUTPUT'];

    commonVariables.forEach((key) => {
        let value = process.env[key];
        if (value) {
            logger.info('Setting OPC UA IoTAgent environment variable %s to environment value: %s', key, value);
        }
    });

    if (process.env.CONFIGURATION_TYPE) {
        config.configurationType = process.env.CONFIGURATION_TYPE;
    }
    if (process.env.CONFIG_RETRIEVAL) {
        config.configRetrieval = process.env.CONFIG_RETRIEVAL;
    }
    if (process.env.DEFAULT_KEY) {
        config.defaultKey = process.env.DEFAULT_KEY;
    }
    if (process.env.DEFAULT_TRANSPORT) {
        config.defaultTransport = process.env.DEFAULT_TRANSPORT;
    }

    iotaVariables.forEach((key) => {
        let value = process.env[key];
        if (value) {
            logger.info('Setting IoTAgent Lib environment variable %s to environment value: %s', key, value);
        }
    });

    if (process.env.IOTA_LOGLEVEL) {
        config.iota.logLevel = process.env.IOTA_LOGLEVEL;
    }

    if (process.env.IOTA_TIMESTAMP) {
        config.iota.timestamp = process.env.IOTA_TIMESTAMP === 'true' ? true : false;
    }

    if (process.env.IOTA_CB_HOST) {
        config.iota.contextBroker.host = process.env.IOTA_CB_HOST;
    }

    if (process.env.IOTA_CB_PORT) {
        config.iota.contextBroker.port = process.env.IOTA_CB_PORT;
    }

    if (process.env.IOTA_CB_NGSIVERSION) {
        config.iota.contextBroker.ngsiVersion = process.env.IOTA_CB_NGSIVERSION;
    }

    if (process.env.IOTA_CB_NGSILDCONTEXT) {
        config.iota.contextBroker.jsonLdContext = process.env.IOTA_CB_NGSILDCONTEXT;
    }

    if (process.env.IOTA_CB_SERVICE) {
        config.iota.contextBroker.service = process.env.IOTA_CB_SERVICE;
    }

    if (process.env.IOTA_CB_SUBSERVICE) {
        config.iota.contextBroker.subservice = process.env.IOTA_CB_SUBSERVICE;
    }

    if (process.env.IOTA_NORTH_PORT) {
        config.iota.server.port = process.env.IOTA_NORTH_PORT;
    }

    if (process.env.IOTA_REGISTRY_TYPE) {
        config.iota.deviceRegistry.type = process.env.IOTA_REGISTRY_TYPE;
    }

    if (process.env.IOTA_MONGO_HOST) {
        config.iota.mongodb.host = process.env.IOTA_MONGO_HOST;
    }

    if (process.env.IOTA_MONGO_PORT) {
        config.iota.mongodb.port = process.env.IOTA_MONGO_PORT;
    }

    if (process.env.IOTA_MONGO_DB) {
        config.iota.mongodb.db = process.env.IOTA_MONGO_DB;
    }

    if (process.env.IOTA_SERVICE) {
        config.iota.service = process.env.IOTA_SERVICE;
    }

    if (process.env.IOTA_SUBSERVICE) {
        config.iota.subservice = process.env.IOTA_SUBSERVICE;
    }

    if (process.env.IOTA_PROVIDER_URL) {
        config.iota.providerUrl = process.env.IOTA_PROVIDER_URL;
    }

    if (process.env.IOTA_DEVICEREGDURATION) {
        config.iota.deviceRegistrationDuration = process.env.IOTA_DEVICEREGDURATION;
    }

    if (process.env.IOTA_DEFAULTTYPE) {
        config.iota.defaultType = process.env.IOTA_DEFAULTTYPE;
    }

    if (process.env.IOTA_DEFAULTRESOURCE) {
        config.iota.defaultResource = process.env.IOTA_DEFAULTRESOURCE;
    }

    if (process.env.IOTA_EXPLICITATTRS) {
        config.iota.explicitAttrs = process.env.IOTA_EXPLICITATTRS === 'true' ? true : false;
    }

    if (process.env.IOTA_EXTENDED_FORBIDDEN_CHARACTERS) {
        config.iota.extendedForbiddenCharacters = process.env.IOTA_EXTENDED_FORBIDDEN_CHARACTERS;
    }

    if (process.env.IOTA_AUTOPROVISION) {
        config.iota.autoprovision = process.env.IOTA_AUTOPROVISION === 'true' ? true : false;
    }

    if (process.env.IOTA_EXPRESS_LIMIT) {
        config.iota.expressLimit = process.env.IOTA_EXPRESS_LIMIT;
    }

    opcUAVariables.forEach((key) => {
        let value = process.env[key];
        if (value) {
            if (key.endsWith('USERNAME') || key.endsWith('PASSWORD') || key.endsWith('KEY')) {
                value = '********';
            }
            logger.info('Setting OPC UA environment variable %s to environment value: %s', key, value);
        }
    });

    protectedVariables.forEach((key) => {
        iotAgentLib.configModule.getSecretData(key);
    });

    if (process.env.IOTA_OPCUA_ENDPOINT) {
        config.opcua.endpoint = process.env.IOTA_OPCUA_ENDPOINT;
    }

    if (process.env.IOTA_OPCUA_SECURITY_MODE) {
        config.opcua.securityMode = process.env.IOTA_OPCUA_SECURITY_MODE;
    }

    if (process.env.IOTA_OPCUA_SECURITY_POLICY) {
        config.opcua.securityPolicy = process.env.IOTA_OPCUA_SECURITY_POLICY;
    }

    if (process.env.IOTA_OPCUA_SECURITY_USERNAME) {
        config.opcua.username = process.env.IOTA_OPCUA_SECURITY_USERNAME;
    }

    if (process.env.IOTA_OPCUA_SECURITY_PASSWORD) {
        config.opcua.password = process.env.IOTA_OPCUA_SECURITY_PASSWORD;
    }

    if (process.env.IOTA_OPCUA_UNIQUE_SUBSCRIPTION) {
        config.opcua.uniqueSubscription = process.env.IOTA_OPCUA_UNIQUE_SUBSCRIPTION === 'true' ? true : false;
    }

    if (process.env.IOTA_OPCUA_SUBSCRIPTION_NOTIFICATIONS_PER_PUBLISH) {
        config.opcua.subscription.maxNotificationsPerPublish = process.env.IOTA_OPCUA_SUBSCRIPTION_NOTIFICATIONS_PER_PUBLISH;
    }

    if (process.env.IOTA_OPCUA_SUBSCRIPTION_PUBLISHING_ENABLED) {
        config.opcua.subscription.publishingEnabled = process.env.IOTA_OPCUA_SUBSCRIPTION_PUBLISHING_ENABLED === 'true' ? true : false;
    }

    if (process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_LIFETIME_COUNT) {
        config.opcua.subscription.requestedLifetimeCount = process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_LIFETIME_COUNT;
    }

    if (process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_MAX_KEEP_ALIVE_COUNT) {
        config.opcua.subscription.requestedMaxKeepAliveCount = process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_MAX_KEEP_ALIVE_COUNT;
    }

    if (process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_PUBLISHING_INTERVAL) {
        config.opcua.subscription.requestedPublishingInterval = process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_PUBLISHING_INTERVAL;
    }

    if (process.env.IOTA_OPCUA_SUBSCRIPTION_PRIORITY) {
        config.opcua.subscription.priority = process.env.IOTA_OPCUA_SUBSCRIPTION_PRIORITY;
    }

    mappingToolVariables.forEach((key) => {
        let value = process.env[key];
        if (value) {
            logger.info('Setting mappingTool environment variable %s to environment value: %s', key, value);
        }
    });

    if (process.env.IOTA_OPCUA_MT_POLLING) {
        config.mappingTool.polling = process.env.IOTA_OPCUA_MT_POLLING === 'true' ? true : false;
    }

    if (process.env.IOTA_OPCUA_MT_AGENT_ID) {
        config.mappingTool.agentId = process.env.IOTA_OPCUA_MT_AGENT_ID;
    }

    if (process.env.IOTA_OPCUA_MT_ENTITY_ID) {
        config.mappingTool.entityId = process.env.IOTA_OPCUA_MT_ENTITY_ID;
    }

    if (process.env.IOTA_OPCUA_MT_ENTITY_TYPE) {
        config.mappingTool.entityType = process.env.IOTA_OPCUA_MT_ENTITY_TYPE;
    }

    if (process.env.IOTA_OPCUA_MT_NAMESPACE_IGNORE) {
        config.mappingTool.namespaceIgnore = process.env.IOTA_OPCUA_MT_NAMESPACE_IGNORE;
    }

    if (process.env.IOTA_OPCUA_MT_STORE_OUTPUT) {
        config.mappingTool.storeOutput = process.env.IOTA_OPCUA_MT_STORE_OUTPUT === 'true' ? true : false;
    }
}

function setConfig(newConfig) {
    config = newConfig;

    processEnvironmentVariables();
}

function getConfig() {
    return config;
}

function setLogger(newLogger) {
    logger = newLogger;
}

function getLogger() {
    return logger;
}

exports.setConfig = setConfig;
exports.getConfig = getConfig;
exports.setLogger = setLogger;
exports.getLogger = getLogger;
