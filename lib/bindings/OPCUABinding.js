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
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contact@eng.it]
 */

/* eslint-disable no-unused-vars */

const opcua = require('node-opcua');
const async = require('async');
const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require('../iotaUtils');
const commonBindings = require('../commonBindings');
const context = {
    op: 'IoTAgentOPCUA.OPCUABinding'
};
const config = require('../../config/configService');

let the_session, the_subscription;
var client;

async function readValueFromOPCUANode(opcuaNodeId) {
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }
    const dataValue = await the_session.readVariableValue(opcuaNodeId);
    if (dataValue.value == null) {
        return null;
    } else {
        config.getLogger().info(context, opcuaNodeId + ' read variable -> ' + dataValue.toString());
        return dataValue.value.value;
    }
}

async function doesOPCUANodeExist(opcuaNodeId) {
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }

    var node = {
        nodeId: opcuaNodeId
    };
    // BrowseFileDescriptions
    const b = [
        {
            nodeId: node.nodeId,
            referenceTypeId: 'Organizes',
            includeSubtypes: true,
            browseDirection: opcua.BrowseDirection.Forward,
            resultMask: 0x3f
        },
        {
            nodeId: node.nodeId,
            referenceTypeId: 'Aggregates',
            includeSubtypes: true,
            browseDirection: opcua.BrowseDirection.Forward,
            resultMask: 0x3f
        },
        {
            nodeId: node.nodeId,
            referenceTypeId: 'HasSubtype',
            includeSubtypes: true,
            browseDirection: opcua.BrowseDirection.Forward,
            resultMask: 0x3f
        }
    ];
    const results = await the_session.browse(b);
    return results;
}

async function connectToClient() {
    const endpointUrl = config.getConfig().opcua.endpoint;
    try {
        await client.connect(endpointUrl);

        config.getLogger().info(context, 'Connected to the OPCUA Server');

        client.on('backoff', (retry, delay) => config.getLogger().info('still trying to connect to ', endpointUrl, ': retry =', retry, 'next attempt in ', delay / 1000, 'seconds'));
    } catch (err) {
        throw new Error(err);
    }
}

async function createSession() {
    try {
        const session = await client.createSession();
        the_session = session;

        client
            .on('connection_reestablished', function () {
                config.getLogger().info(context, '!!!!!!!!!!!!!!!!!!!!!!!! CONNECTION RESTABLISHED !!!!!!!!!!!!!!!!!!!');
            })
            .on('after_reconnection', function (err) {
                config.getLogger().info(context, '... reconnection process has been completed: ', err);
            })
            .on('close', function (err) {
                config.getLogger().info(context, 'Check Security Settings ', err);
            })
            .on('backoff', function (nb, delay) {
                config.getLogger().error(context, 'connection failed for the', nb, ' time ... We will retry in ', delay, ' ms');
            })
            .on('start_reconnection', function () {
                config.getLogger().error(context, 'start_reconnection not working so aborting');
            });
    } catch (err) {
        throw new Error(err);
    }
}

async function createSubscription() {
    //TODO
    const subscriptionOptions = {
        maxNotificationsPerPublish: 1000,
        publishingEnabled: true,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        requestedPublishingInterval: 1000,
        priority: 128
    };

    try {
        const subscription = await the_session.createSubscription2(subscriptionOptions);
        the_subscription = subscription;

        the_subscription
            .on('started', function () {
                config.getLogger().info(context, 'subscription started for 2 seconds - subscriptionId=', the_subscription.subscriptionId);
            })
            .on('keepalive', function () {
                config.getLogger().info(context, 'subscription keepalive');
            })
            .on('terminated', function () {
                config.getLogger().info(context, 'terminated');
            });
    } catch (err) {
        throw new Error(err);
    }
}

async function startMonitoring() {
    config.getConfig().iota.contexts.forEach(async function (opcuaServerConfigContext) {
        opcuaServerConfigContext.mappings.forEach(async function (mapping) {
            const opcua_id = mapping.opcua_id;
            const results = await doesOPCUANodeExist(opcua_id);
            if (results && results.length > 0) {
                let result = results[0];
                if (result.statusCode == opcua.StatusCodes.Good) {
                    const itemToMonitor = {
                        nodeId: opcua.resolveNodeId(opcua_id),
                        attributeId: opcua.AttributeIds.Value
                    };
                    const monitoringParamaters = {
                        samplingInterval: 100,
                        discardOldest: true,
                        queueSize: 10
                    };
                    try {
                        const monitoredItem = await the_subscription.monitor(itemToMonitor, monitoringParamaters, opcua.TimestampsToReturn.Both);
                        config.getLogger().info(context, opcua_id + ' added to the monitoring pool!');
                        monitoredItem.on('changed', function (dataValue) {
                            if (dataValue.statusCode.valueOf() == 0) {
                                config.getLogger().info(context, opcua_id + ' value changed -> ' + dataValue.value.value);
                                commonBindings.opcuaMessageHandler(opcuaServerConfigContext.id, mapping, dataValue.value.value, dataValue.sourceTimestamp);
                            } else {
                                config.getLogger().error(context, opcua_id + ' value change error');
                                throw new Error(opcua_id + ' value change error');
                            }
                        });
                    } catch (err) {
                        throw new Error(err);
                    }
                } else {
                    config.getLogger().error(context, opcua_id + ' refers to a node that does not exist in the server address space.');
                }
            }
        });
    });
}

async function terminateSession() {
    try {
        await the_subscription.terminate();
    } catch (err) {
        throw new Error(err);
    }
}

async function closeSession() {
    try {
        await the_session.close();
    } catch (err) {
        throw new Error(err);
    }
}

/**
 * Generate a function that executes the given command in the device.
 *
 * @param {Object} device           Object containing all the information about a device.
 * @param {Object} attribute        Attribute in NGSI format.
 * @return {Function}               Command execution function ready to be called with async.series.
 */
function generateCommandExecution(apiKey, device, attributes) {
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }

    attributes.forEach(function (attribute) {
        var input = device.inputArguments;
        if (input != null) {
            var i = 0;
            input.forEach(function (inputType) {
                inputType['value'] = attribute.value[i++];
            });
        }

        var methodsToCall = [];
        methodsToCall.push({
            objectId: '' + device.object_id,
            methodId: '' + device.opcua_id,

            inputArguments: input
        });
        config.getLogger().info(context, 'Method to call =' + JSON.stringify(methodsToCall));

        the_session.call(methodsToCall);
    });
}

/**
 * Device provisioning handler.
 *
 * @param {Object} device           Device object containing all the information about the provisioned device.
 */
function deviceProvisioningHandler(device, callback) {
    callback(null, device);
}

/**
 * Device updating handler.
 *
 * @param {Object} device           Device object containing all the information about the provisioned device.
 */
function deviceUpdatingHandler(device, callback) {
    callback(null, device);
}

/**
 * Handles a command execution request coming from the Context Broker. This handler should:
 *  - Identify the device affected by the command.
 *  - Send the command to the appropriate MQTT topic.
 *  - Update the command status in the Context Broker.
 *
 * @param {Object} device           Device data stored in the IOTA.
 * @param {String} attributes       Command attributes (in NGSIv1 format).
 */
function commandHandler(device, attributes, callback) {
    config.getLogger().debug(context, 'Handling OPCUA command for device [%s]', device.id);

    utils.getEffectiveApiKey(device.service, device.subservice, device, function (error, apiKey) {
        async.series(attributes.map(generateCommandExecution.bind(null, apiKey, device)), callback);
    });
}

async function start() {
    if (!config.getConfig().opcua) {
        config.getLogger().fatal(context, 'GLOBAL-002: Configuration error. Configuration object [config.opcua] is missing');
        throw new Error('GLOBAL-002: Configuration error. Configuration object [config.opcua] is missing');
    }

    const opcuaSecurityMode = opcua.MessageSecurityMode[config.getConfig().opcua.securityMode];
    const opcuaSecurityPolicy = opcua.SecurityPolicy[config.getConfig().opcua.securityPolicy];

    if (opcuaSecurityMode === opcua.MessageSecurityMode.Invalid) {
        config.getLogger().fatal(context, 'Invalid Security mode,  should be ' + opcua.MessageSecurityMode.enums.join(' '));
        throw new Error('Invalid SecurityMode should be ' + opcua.MessageSecurityMode.enums.join(' '));
    }
    if (opcuaSecurityPolicy === opcua.SecurityPolicy.Invalid) {
        config.getLogger().fatal(context, 'Invalid securityPolicy should be ' + opcua.SecurityPolicy.enums.join(' '));
        throw new Error('Invalid securityPolicy should be ' + opcua.SecurityPolicy.enums.join(' '));
    }

    var opcUAClientOptions = {
        endpointMustExist: false,
        securityMode: opcuaSecurityMode,
        securityPolicy: opcuaSecurityPolicy,
        defaultSecureTokenLifetime: 400000,
        keepSessionAlive: true,
        requestedSessionTimeout: 100000, // very long 100 seconds
        connectionStrategy: {
            maxRetry: 10,
            initialDelay: 2000,
            maxDelay: 10 * 1000
        }
    };

    const certificateFolder = path.join(process.cwd(), '../certificates');
    const certificateFile = path.join(certificateFolder, 'server_certificate.pem');

    const certificateManager = new opcua.OPCUACertificateManager({
        rootFolder: certificateFolder
    });
    await certificateManager.initialize();

    const privateKeyFile = certificateManager.privateKey;
    if (!fs.existsSync(certificateFile)) {
        await certificateManager.createSelfSignedCertificate({
            subject: '/CN=localhost/O=Engineering Ingegneria Informatica S.p.A./L=Palermo',
            startDate: new Date(),
            dns: [],
            validity: 365 * 5,
            applicationUri: `urn:${os.hostname()}:NodeOPCUA-Client`,
            outputFile: certificateFile
        });
    }

    var resolvedCertificateFilePath = path.resolve(certificateFile).replace(/\\/g, '/');
    var resolvedPrivateKeyFilePath = path.resolve(privateKeyFile).replace(/\\/g, '/');
    opcUAClientOptions['certificateFile'] = resolvedCertificateFilePath;
    opcUAClientOptions['privateKeyFile'] = resolvedPrivateKeyFilePath;
    client = opcua.OPCUAClient.create(opcUAClientOptions);

    async.series([connectToClient, createSession, createSubscription, startMonitoring], function (err) {
        if (err) {
            config.getLogger().fatal(context, err.message);
            client.disconnect();
        }
    });
}

async function stop() {
    config.getLogger().info(context, 'Gracefully stopping IotAgent');
    async.series([terminateSession, closeSession], function (err) {
        if (err) {
            config.getLogger().fatal(context, err.message);
        }
        client.disconnect();
    });
}

exports.deviceProvisioningHandler = deviceProvisioningHandler;
exports.deviceUpdatingHandler = deviceUpdatingHandler;
exports.commandHandler = commandHandler;
exports.start = start;
exports.stop = stop;
exports.protocol = 'OPCUA';
