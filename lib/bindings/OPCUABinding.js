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

/* eslint-disable no-unused-vars */

const opcua = require('node-opcua');
const async = require('async');
const fs = require('fs');
const os = require('os');
const path = require('path');
const moment = require('moment');
const commonBindings = require('../commonBindings');
const metaBindings = require('../metaBindings');
const context = {
    op: 'IoTAgentOPCUA.OPCUABinding'
};
const config = require('../configService');
const { FORBIDDEN_NGSI_CHARS } = require('../constants');

let the_session;
let the_subscription;
let client;

/**
 * Read variable value from OPCUA Server
 * @param opcuaNodeId
 * @returns value of the variable
 */
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

/**
 * Read variable value type from OPCUA Server
 * @param opcuaNodeId
 * @returns value type of the variable
 */
async function readValueTypeFromOPCUANode(opcuaNodeId) {
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }
    const dataValue = await the_session.readVariableValue(opcuaNodeId);
    if (dataValue.value == null) {
        return null;
    } else {
        config.getLogger().info(context, opcuaNodeId + ' read variable type -> ' + dataValue.toString());
        return dataValue.value.dataType;
    }
}

/**
 * Check if OPCUA node exist and return results array
 * @param opcuaNodeId
 * @returns results array
 */
async function doesOPCUANodeExist(opcuaNodeId) {
    /* istanbul ignore if */
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }

    const node = {
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

/**
 * Connect to OPCUA Server or throw exception if it fails
 */
async function connectToClient() {
    const endpointUrl = config.getConfig().opcua.endpoint;
    try {
        await client.connect(endpointUrl);

        config.getLogger().info(context, 'Connected to the OPCUA Server');

        client.on('backoff', (retry, delay) => config.getLogger().info('still trying to connect to ', endpointUrl, ': retry =', retry, 'next attempt in ', delay / 1000, 'seconds'));
    } catch (err) {
        /* istanbul ignore next */
        throw new Error(err);
    }
}

/**
 * Create OPCUA Session, throws exception if it fails
 */
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
        /* istanbul ignore next */
        throw new Error(err);
    }
}

async function createSubscription() {
    const subscriptionOptions = {
        maxNotificationsPerPublish: config.getConfig().opcua.subscription.maxNotificationsPerPublish,
        publishingEnabled: config.getConfig().opcua.subscription.publishingEnabled,
        requestedLifetimeCount: config.getConfig().opcua.subscription.requestedLifetimeCount,
        requestedMaxKeepAliveCount: config.getConfig().opcua.subscription.requestedMaxKeepAliveCount,
        requestedPublishingInterval: config.getConfig().opcua.subscription.requestedPublishingInterval,
        priority: config.getConfig().opcua.subscription.priority
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
        /* istanbul ignore next */
        throw new Error(err);
    }
}

/**
 * Start monitoring OPCUA attributes
 */
async function startMonitoring() {
    config.getConfig().iota.contexts.forEach(async function (opcuaServerConfigContext) {
        opcuaServerConfigContext.mappings.forEach(async function (mapping) {
            const opcua_id = mapping.opcua_id;
            const results = await doesOPCUANodeExist(opcua_id);
            if (results && results.length > 0) {
                const result = results[0];
                if (result.statusCode == opcua.StatusCodes.Good) {
                    if (config.getConfig().iota.events && config.getConfig().iota.events.find((obj) => obj.opcua_id === mapping.opcua_id)) {
                        const itemToMonitor = {
                            nodeId: opcua.resolveNodeId(opcua_id),
                            attributeId: opcua.AttributeIds.EventNotifier
                        };
                        const fields = config.getConfig().iota.events.find((obj) => obj.opcua_id === mapping.opcua_id).fields;
                        const eventFilter = opcua.constructEventFilter(fields);
                        const monitoringParamaters = {
                            samplingInterval: 100,
                            discardOldest: true,
                            filter: eventFilter,
                            queueSize: 10
                        };
                        try {
                            const monitoredItem = await the_subscription.monitor(itemToMonitor, monitoringParamaters, opcua.TimestampsToReturn.Both);
                            config.getLogger().info(context, opcua_id + ' added to the monitoring pool!');
                            monitoredItem.on('changed', function (events) {
                                //Variant[]
                                var variableValue = '';
                                fields.forEach(function (field, index) {
                                    if (field.type == 'ByteString') {
                                        variableValue += events[index] && events[index].value ? Buffer(events[index].value).toString(16) : 'N/A';
                                    } else if (field.type == 'NodeId') {
                                        variableValue += events[index] && events[index].value && events[index].value.value ? events[index].value.value : 'N/A';
                                    } else if (field.type == 'String' || field.type == 'UInt16') {
                                        variableValue += events[index] && events[index].value ? events[index].value : 'N/A';
                                    } else if (field.type == 'DateTime') {
                                        variableValue += events[index] && events[index].value ? moment(events[index].value).valueOf() : 'N/A';
                                    } else if (field.type == 'LocalizedText') {
                                        variableValue += events[index] && events[index].value && events[index].value.text ? events[index].value.text : 'N/A';
                                    }
                                    variableValue += ' | ';
                                });
                                variableValue = variableValue.slice(0, -3);
                                const forbiddenCharacters = [...config.getConfig().iota.extendedForbiddenCharacters, ...FORBIDDEN_NGSI_CHARS];
                                config.getLogger().info(context, 'Using forbidden characters set: ' + JSON.stringify(forbiddenCharacters));
                                variableValue = [...variableValue].map((char) => (forbiddenCharacters ? '' : char)).join('');
                                /* istanbul ignore else */
                                config.getLogger().info(context, opcua_id + ' event triggered -> ' + events[1]?.value?.text);
                                commonBindings.opcuaMessageHandler(opcuaServerConfigContext.id, mapping, variableValue, events[2]?.value);
                            });
                        } catch (err) {
                            /* istanbul ignore next */
                            throw new Error(err);
                        }
                    } else {
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
                                /* istanbul ignore else */
                                if (dataValue.statusCode.valueOf() == 0) {
                                    if (dataValue.value.dataType === opcua.DataType.UInt64) {
                                        if (Array.isArray(dataValue.value.value) && dataValue.value.value.length === 2) {
                                            const msb = dataValue.value.value[0];
                                            const lsb = dataValue.value.value[1];
                                            const value = (msb << 32) | lsb;
                                            commonBindings.opcuaMessageHandler(opcuaServerConfigContext.id, mapping, value, dataValue.sourceTimestamp);
                                        }
                                    } else {
                                        config.getLogger().info(context, opcua_id + ' value changed -> ' + dataValue.value.value);
                                        commonBindings.opcuaMessageHandler(opcuaServerConfigContext.id, mapping, dataValue.value.value, dataValue.sourceTimestamp);
                                    }
                                } else {
                                    config.getLogger().error(context, opcua_id + ' value change error');
                                    throw new Error(opcua_id + ' value change error');
                                }
                            });
                        } catch (err) {
                            /* istanbul ignore next */
                            throw new Error(err);
                        }
                    }
                } else {
                    /* istanbul ignore next */
                    config.getLogger().error(context, opcua_id + ' refers to a node that does not exist in the server address space.');
                }
            }
        });
    });
}

/* istanbul ignore next */
async function terminateSession() {
    try {
        await the_subscription.terminate();
    } catch (err) {
        throw new Error(err);
    }
}

/* istanbul ignore next */
async function closeSession() {
    try {
        await the_session.close();
    } catch (err) {
        throw new Error(err);
    }
}

/**
 * Parse command input argument and convert it into an array of values
 * @param attribute
 * @return inputs as array of values
 */
function prepareInputArguments(attribute) {
    const inputs = [];
    let parsedValue;
    try {
        if (Array.isArray(attribute.value)) {
            config.getLogger().info(context, 'Found an Array as command input');
            for (const singleValue of attribute.value) {
                inputs.push(singleValue);
            }
        } else {
            inputs.push(attribute.value);
            config.getLogger().info(context, 'Command input not an array. Considering it as a single value');
        }
    } catch (e) {
        inputs.push(attribute.value);
        config.getLogger().warn(context, 'Unable to determine the type of the command input, considering it as a single value');
    }
    return inputs;
}

/**
 * Generate a function that executes the given command in the device.
 *
 * @param {string} apiKey           APIKey of the device's service or default APIKey.
 * @param {Object} device           Object containing all the information about a device.
 * @param {Object} attribute        Attribute in NGSI format.
 * @return {Function}               Command execution function ready to be called with async.series.
 */
async function executeCommand(apiKey, device, attribute, serialized, contentType, callback) {
    /* istanbul ignore if */
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }

    let foundMapping = {};
    for (const contextSubscription of config.getConfig().iota.contextSubscriptions) {
        for (const mapping of contextSubscription.mappings) {
            if (mapping.ocb_id === attribute.name) {
                foundMapping = mapping;
                break;
            }
        }
    }

    const inputs = prepareInputArguments(attribute);

    // set input arguments
    for (let i = 0; i < foundMapping.inputArguments.length; i++) {
        foundMapping.inputArguments[i].value = inputs[i];
    }

    const methodsToCall = [];
    methodsToCall.push({
        objectId: String(foundMapping.object_id),
        methodId: String(foundMapping.opcua_id),
        inputArguments: foundMapping.inputArguments
    });
    config.getLogger().info(context, 'Method to call =' + JSON.stringify(methodsToCall));

    const commandsResults = await the_session.call(methodsToCall);
    /* istanbul ignore else */
    if (commandsResults.length > 0) {
        const thisCommand = commandsResults[0];
        return {
            attributeName: attribute.name,
            statusCode: thisCommand.statusCode.value,
            resultValue: thisCommand.outputArguments[0].dataType < 12 ? thisCommand.outputArguments[0].value : thisCommand.outputArguments[0].value[0]
        };
    } else {
        config.getLogger().fatal(context, 'COMMAND-001: Error during command execution: commandResults.length is null');
        throw new Error('COMMAND-001: Error during command execution: commandResults.length is null');
    }
}

/**
 * Generate a function that executes the given update in the device.
 *
 * @param {string} apiKey           APIKey of the device's service or default APIKey.
 * @param {Object} device           Object containing all the information about a device.
 * @param {Object} attribute        Attribute in NGSI format.
 * @return {Function}               Update execution function ready to be called with async.series.
 */
async function executeUpdate(apiKey, device, attribute, serialized, contentType, callback) {
    /* istanbul ignore next */
    if (!the_session) {
        config.getLogger().error(context, 'No Connection to the OPC UA Server');
        return null;
    }

    let foundMapping = {};
    for (const context of config.getConfig().iota.contexts) {
        for (const mapping of context.mappings) {
            if (mapping.ocb_id === attribute.name) {
                foundMapping = mapping;
                break;
            }
        }
    }
    if (Object.keys(foundMapping).length === 0) {
        for (const context of config.getConfig().iota.contextSubscriptions) {
            for (const mapping of context.mappings) {
                if (mapping.ocb_id === attribute.name) {
                    foundMapping = mapping;
                    break;
                }
            }
        }
    }

    var valueType = await readValueTypeFromOPCUANode(foundMapping.opcua_id);

    var nodesToWrite = [
        {
            nodeId: foundMapping.opcua_id,
            attributeId: opcua.AttributeIds.Value,
            indexRange: null,
            value: {
                value: {
                    dataType: valueType,
                    value: attribute.value
                }
            }
        }
    ];
    config.getLogger().info(context, 'Update to execute =' + JSON.stringify(nodesToWrite));

    const updateResults = await the_session.write(nodesToWrite);
    if (updateResults.length > 0) {
        const thisUpdate = updateResults[0];
        return {
            attributeName: attribute.name,
            statusCode: thisUpdate._name,
            resultValue: thisUpdate._description
        };
    } else {
        config.getLogger().fatal(context, 'UPDATE-001: Error during update execution: updateResults.length is null');
        throw new Error('COMMAND-001: Error during update execution: updateResults.length is null');
    }
}

/**
 * Executes the given query in the device.
 *
 * @param {string} apiKey           APIKey of the device's service or default APIKey.
 * @param {Object} device           Object containing all the information about a device.
 * @param {Object} attribute        Attribute in NGSI format.
 * @return {Function}               Query execution result
 */
async function executeQuery(apiKey, device, attribute, callback) {
    const type = device.type;
    const id = device.id;
    const contextElement = {
        type,
        id
    };

    let attributeType = 'string';
    let lazySet = [];

    if (device.lazy) {
        lazySet = device.lazy;
    } else if (config.getConfig().iota.types[type] && config.getConfig().iota.types[type].lazy) {
        lazySet = config.getConfig().iota.types[type].lazy;
    }

    const lazyObject = lazySet.find((lazyAttribute) => lazyAttribute.name === attribute);
    /* istanbul ignore if */
    if (!lazyObject) {
        config.getLogger().fatal(context, "QUERY-002: Query execution could not be handled, as lazy attribute [%s] wasn't found", attribute);
        throw new Error("QUERY-002: Query execution could not be handled, as lazy attribute wasn't found");
    }

    attributeType = lazyObject.type;

    let foundMapping = {};
    for (const context of config.getConfig().iota.contextSubscriptions) {
        for (const mapping of context.mappings) {
            if (mapping.ocb_id === attribute) {
                foundMapping = mapping;
                break;
            }
        }
    }
    const value = await readValueFromOPCUANode(foundMapping.opcua_id);
    contextElement[attribute] = {
        type: attributeType,
        value
    };

    return contextElement;
}

/**
 * Device provisioning handler.
 *
 * @param {Object} device           Device object containing all the information about the provisioned device.
 */
/* istanbul ignore next */
function deviceProvisioningHandler(device, callback) {
    callback(null, device);
}

/**
 * Device updating handler.
 *
 * @param {Object} device           Device object containing all the information about the provisioned device.
 */
/* istanbul ignore next */
function deviceUpdatingHandler(device, callback) {
    callback(null, device);
}

/**
 * Prepare certificates and start OPCUA binding
 */
async function start() {
    if (!config.getConfig().opcua) {
        config.getLogger().fatal(context, 'GLOBAL-002: Configuration error. Configuration object [config.opcua] is missing');
        throw new Error('GLOBAL-002: Configuration error. Configuration object [config.opcua] is missing');
    }

    const opcuaSecurityMode = opcua.MessageSecurityMode[config.getConfig().opcua.securityMode];
    const opcuaSecurityPolicy = opcua.SecurityPolicy[config.getConfig().opcua.securityPolicy];

    /* istanbul ignore if */
    if (opcuaSecurityMode === opcua.MessageSecurityMode.Invalid) {
        config.getLogger().fatal(context, 'Invalid Security mode,  should be ' + opcua.MessageSecurityMode.enums.join(' '));
        throw new Error('Invalid SecurityMode should be ' + opcua.MessageSecurityMode.enums.join(' '));
    }
    /* istanbul ignore if */
    if (opcuaSecurityPolicy === opcua.SecurityPolicy.Invalid) {
        config.getLogger().fatal(context, 'Invalid securityPolicy should be ' + opcua.SecurityPolicy.enums.join(' '));
        throw new Error('Invalid securityPolicy should be ' + opcua.SecurityPolicy.enums.join(' '));
    }

    const opcUAClientOptions = {
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

    const certificateFolder = path.join(process.cwd(), '/certificates');
    const certificateFile = path.join(certificateFolder, 'server_certificate.pem');

    const certificateManager = new opcua.OPCUACertificateManager({
        rootFolder: certificateFolder,
        name: ''
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

    const resolvedCertificateFilePath = path.resolve(certificateFile).replace(/\\/g, '/');
    const resolvedPrivateKeyFilePath = path.resolve(privateKeyFile).replace(/\\/g, '/');
    opcUAClientOptions.certificateFile = resolvedCertificateFilePath;
    opcUAClientOptions.privateKeyFile = resolvedPrivateKeyFilePath;
    opcUAClientOptions.clientCertificateManager = certificateManager;
    client = opcua.OPCUAClient.create(opcUAClientOptions);

    async.series([connectToClient, initNorthbound, createSession, createSubscription, startMonitoring], function (err) {
        /* istanbul ignore if */
        if (err) {
            config.getLogger().fatal(context, err.message);
            client.disconnect();
        }
    });
}

/* istanbul ignore next */
async function stop() {
    config.getLogger().info(context, 'Gracefully stopping IotAgent');
    async.series([terminateSession, closeSession], function (err) {
        if (err) {
            config.getLogger().fatal(context, err.message);
        }
        client.disconnect();
    });
}

/**
 * Additional operations for Northbound binding
 */
async function initNorthbound() {
    try {
        if (config.getConfig().autoprovision) {
            await metaBindings.performAutoProvisioning();
        }
    } catch (err) {
        /* istanbul ignore next */
        throw new Error(err);
    }
}

exports.deviceProvisioningHandler = deviceProvisioningHandler;
exports.deviceUpdatingHandler = deviceUpdatingHandler;
exports.executeCommand = executeCommand;
exports.executeUpdate = executeUpdate;
exports.executeQuery = executeQuery;
exports.readValueFromOPCUANode = readValueFromOPCUANode;
exports.readValueTypeFromOPCUANode = readValueTypeFromOPCUANode;
exports.start = start;
exports.stop = stop;
exports.protocol = 'OPCUA';
