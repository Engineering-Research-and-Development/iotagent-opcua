/*
 * Copyright 2016 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of iotagent-ul
 *
 * iotagent-ul is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-ul is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-ul.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[iot_support@tid.es]
 */

const iotAgentLib = require('iotagent-node-lib');
const errors = require('./errors');
const dateFormat = require('dateformat');
const _ = require('underscore');
const context = {
    op: 'IOTAUL.IoTUtils'
};
const async = require('async');
const apply = async.apply;
const constants = require('./constants');
const config = require('../config/configService');
const axios = require('axios');

/**
 * Get the API Key for the selected service if there is any, or the default API Key if a specific one does not exist.
 *
 * @param {String} service          Name of the service whose API Key we are retrieving.
 * @param {String} subservice       Name of the subservice whose API Key we are retrieving.
 * @param {Json} device             Device object.
 */
function getEffectiveApiKey(service, subservice, device, callback) {
    config.getLogger().debug(context, 'Getting effective API Key');

    if (device && device.apikey) {
        config.getLogger().debug('Using device apikey: %s', device.apikey);
        callback(null, device.apikey);
    } else {
        const type = device.type ? device.type : null;
        iotAgentLib.findConfiguration(service, subservice, type, function (error, group) {
            if (group) {
                config.getLogger().debug('Using found group: %j', group);
                callback(null, group.apikey);
            } else if (config.getConfig().defaultKey) {
                config.getLogger().debug('Using default API Key: %s', config.getConfig().defaultKey);
                callback(null, config.getConfig().defaultKey);
            } else {
                config.getLogger().error(context, 'COMMANDS-002: Could not find any API Key information for device.');
                callback(new errors.GroupNotFound(service, subservice));
            }
        });
    }
}

/**
 * Create MongoGroup
 *
 * @param {String} service          Name of the service whose API Key we are retrieving.
 * @param {String} subservice       Name of the subservice whose API Key we are retrieving.
 * @param {Json} device             Device object.
 */

/**
 * Create Group function for provisioning a service group
 * See https://github.com/telefonicaid/iotagent-node-lib/blob/master/doc/getting-started.md#provisioning-a-service-group
 *
 * @param apiKey api key identifying devices belonging to the group
 * @param cBroker endpoint of the context broker
 * @param entityType type of the entities
 * @param resource path which determines that the device belongs to the group
 * @param service fiware service
 * @param servicePath fiware servicepath
 * @returns {Promise<unknown>}
 */
function callApiCreateGroup(apiKey, cBroker, entityType, resource, service, servicePath) {
    return new Promise((resolve, reject) => {
        const data = {
            services: [
                {
                    apikey: apiKey,
                    cbroker: cBroker,
                    entity_type: entityType,
                    resource
                }
            ]
        };
        axios
            .post(config.getConfig().iota.providerUrl + '/iot/services', data, {
                headers: {
                    'fiware-service': service,
                    'fiware-servicepath': servicePath
                }
            })
            .then(() => {
                resolve(data);
            })
            .catch((err) => {
                if (err.response.status === 409) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
    });
}

function callApiRegisterDevice(device, group) {
    return new Promise((resolve, reject) => {
        const data = {
            services: [
                {
                    device_id: device.id,
                    entity_name, // get from contexts
                    entity_type,
                    apikey,
                    service,
                    subservice,
                    attributes,
                    lazy,
                    commands,
                    endpoint
                }
            ]
        };
        axios
            .post(config.getConfig().iota.providerUrl + '/iot/services', data, {
                headers: {
                    'fiware-service': service,
                    'fiware-servicepath': servicePath
                }
            })
            .then(() => {
                resolve(data);
            })
            .catch((err) => {
                if (err.response.status === 409) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
    });
}

function findOrCreate(deviceId, transport, group, callback) {
    iotAgentLib.getDevice(deviceId, group.service, group.subservice, function (error, device) {
        if (!error && device) {
            callback(null, device, group);
        } else if (error.name === 'DEVICE_NOT_FOUND') {
            const newDevice = {
                id: deviceId,
                service: group.service,
                subservice: group.subservice,
                type: group.type
            };

            if (config.getConfig().iota && config.getConfig().iota.iotManager && config.getConfig().iota.iotManager.protocol) {
                newDevice.protocol = config.getConfig().iota.iotManager.protocol;
            }

            // Fix transport depending on binding
            if (!newDevice.transport) {
                newDevice.transport = transport;
            }

            if ('timestamp' in group && group.timestamp !== undefined) {
                newDevice.timestamp = group.timestamp;
            }
            if ('ngsiVersion' in group && group.ngsiVersion !== undefined) {
                newDevice.ngsiVersion = group.ngsiVersion;
            }
            if ('explicitAttrs' in group && group.explicitAttrs !== undefined) {
                newDevice.explicitAttrs = group.explicitAttrs;
            }
            if ('expressionLanguage' in group && group.expressionLanguage !== undefined) {
                newDevice.expressionLanguage = group.expressionLanguage;
            }
            // Check autoprovision flag in order to register or not device
            if (group.autoprovision === undefined || group.autoprovision === true) {
                callApiRegisterDevice(newDevice, group)
                    .then((error, device, group) => {
                        console.log(error);
                        console.log(device);
                        console.log(group);
                    })
                    .then((err) => {
                        console.log(error);
                    });
            } else {
                config.getLogger().info(context, 'Device %j not provisioned due autoprovision is disabled by its conf %j', newDevice, group);
                callback(new errors.DeviceNotFound(deviceId));
            }
        } else {
            callback(error);
        }
    });
}

function mergeArrays(original, newArray) {
    const originalKeys = _.pluck(original, 'object_id');
    const newKeys = _.pluck(newArray, 'object_id');
    const addedKeys = _.difference(newKeys, originalKeys);
    const differenceArray = newArray.filter(function (item) {
        return addedKeys.indexOf(item.object_id) >= 0;
    });

    return original.concat(differenceArray);
}

/**
 * If the object_id or the name of the attribute is missing, complete it with the other piece of data.
 *
 * @param {Object} attribute            Device attribute
 * @return {*}                          Completed attribute
 */
function setDefaultAttributeIds(attribute) {
    if (!attribute.object_id && attribute.name) {
        attribute.object_id = attribute.name;
    }

    if (!attribute.name && attribute.object_id) {
        attribute.name = attribute.object_id;
    }

    return attribute;
}

/**
 * Complete the information of the device with the information in the configuration group (with precedence of the
 * device).
 *
 * @param {Object} deviceData           Device data.
 * @param {Object} configuration        Configuration data.
 */
function mergeDeviceWithConfiguration(deviceData, configuration, callback) {
    const fields = ['lazy', 'internalAttributes', 'active', 'staticAttributes', 'commands', 'subscriptions'];
    const defaults = [null, null, [], [], [], [], []];
    config.getLogger().debug(context, 'deviceData before merge with conf: %j', deviceData);
    for (let i = 0; i < fields.length; i++) {
        const confField = fields[i] === 'active' ? 'attributes' : fields[i];

        if (deviceData[fields[i]] && configuration && configuration[confField]) {
            deviceData[fields[i]] = mergeArrays(deviceData[fields[i]], configuration[confField]);
        } else if (!deviceData[fields[i]] && configuration && configuration[confField]) {
            deviceData[fields[i]] = configuration[confField];
        } else if (!deviceData[fields[i]] && (!configuration || !configuration[confField])) {
            deviceData[fields[i]] = defaults[i];
        }

        if (deviceData[fields[i]] && ['active', 'lazy', 'commands'].indexOf(fields[i]) >= 0) {
            deviceData[fields[i]] = deviceData[fields[i]].map(setDefaultAttributeIds);
        }
    }

    if (configuration && configuration.cbHost) {
        deviceData.cbHost = configuration.cbHost;
    }
    if (configuration && configuration.ngsiVersion) {
        deviceData.ngsiVersion = configuration.ngsiVersion;
    }
    if (configuration && configuration.expressionLanguage && deviceData.expressionLanguage === undefined) {
        deviceData.expressionLanguage = configuration.expressionLanguage;
    }
    if (configuration && configuration.explicitAttrs !== undefined && deviceData.explicitAttrs === undefined) {
        deviceData.explicitAttrs = configuration.explicitAttrs;
    }
    config.getLogger().debug(context, 'deviceData after merge with conf: %j', deviceData);
    callback(null, deviceData);
}

/**
 * Retrieve a device from the device repository based on the given APIKey and DeviceID, creating one if none is
 * found for the given data.
 *
 * @param {String} deviceId         Device ID of the device that wants to be retrieved or created.
 * @param {String} apiKey           APIKey of the Device Group (or default APIKey).
 */
function retrieveDevice(deviceId, apiKey, transport, callback) {
    // Case of external provisioning when apiKey of message is equal to the configured one.
    // In this case a provisioning through API must be done BEFORE enable the device and apiKeys must match.
    if (apiKey === config.getConfig().defaultKey) {
        iotAgentLib.getDevicesByAttribute('id', deviceId, undefined, undefined, function (error, devices) {
            if (error) {
                callback(error);
            } else if (devices && devices.length === 1) {
                callback(null, devices[0]);
            } else {
                config.getLogger().error(
                    context,

                    "MEASURES-001: Couldn't find device data for APIKey [%s] and DeviceId[%s]",

                    apiKey,
                    deviceId
                );

                callback(new errors.DeviceNotFound(deviceId));
            }
        });
        // Case without configured provisioning. In this case a new group is created and a new device registered.
    } else {
        iotAgentLib.getConfigurationSilently(config.getConfig().iota.defaultResource, apiKey, function (error, group) {
            if (error && error.name === 'DEVICE_GROUP_NOT_FOUND') {
                callApiCreateGroup(apiKey, `http://${config.getConfig().iota.contextBroker.host}:${config.getConfig().iota.contextBroker.port}`, config.getConfig().iota.defaultType, config.getConfig().iota.defaultResource, config.getConfig().iota.service, config.getConfig().iota.subservice)
                    .then((group) => {
                        config.getLogger().debug(context, `Group created ${JSON.stringify(group)}`);
                        group.autoprovision = true;
                        findOrCreate(deviceId, transport, group, function (error, device, group1) {
                            console.log(error);
                            console.log(device);
                            console.log(group1);
                        });
                    })
                    .catch((err) => {
                        config.getLogger().error(context, 'Could not create group: ' + err);
                    });
                // Group already exists
            } else {
                group.autoprovision = true;
                findOrCreate(deviceId, transport, group, function (error, device, group1) {
                    console.log(error);
                    console.log(device);
                    console.log(group1);
                });
            }
        });
        // async.waterfall(
        //     [
        //         apply(iotAgentLib.getConfigurationSilently, config.getConfig().iota.defaultResource, apiKey),
        //         apply(findOrCreate, deviceId, transport),
        //         mergeDeviceWithConfiguration
        //     ],
        //     callback
        // );
    }
}

/**
 * Update the result of a command with the information given by the client.
 *
 * @param {String} apiKey           API Key corresponding to the Devices configuration.
 * @param {Object} device           Device object containing all the information about a device.
 * @param {String} message          UL payload.
 * @param {String} command          Command name.
 * @param {String} status           End status of the command.
 */
function updateCommand(apiKey, device, message, command, status, callback) {
    iotAgentLib.setCommandResult(device.name, config.getConfig().iota.defaultResource, apiKey, command, message, status, device, function (error) {
        if (error) {
            config.getLogger().error(
                context,

                "COMMANDS-003: Couldn't update command status in the Context broker for device [%s]" + ' with apiKey [%s]: %s',
                device.id,
                apiKey,
                error
            );

            callback(error);
        } else {
            config.getLogger().debug(context, 'Single measure for device [%s] with apiKey [%s] successfully updated', device.id, apiKey);

            callback();
        }
    });
}

function manageConfiguration(apiKey, deviceId, device, objMessage, sendFunction, callback) {
    /* eslint-disable-next-line no-unused-vars */
    function handleSendConfigurationError(error, results) {
        if (error) {
            config.getLogger().error(
                context,

                "CONFIG-001: Couldn't get the requested values from the Context Broker: %s",

                error
            );
        } else {
            config.getLogger().debug(context, 'Configuration attributes sent to the device successfully.', deviceId, apiKey);
        }

        callback(error);
    }

    if (objMessage.type === 'configuration') {
        async.waterfall([apply(iotAgentLib.query, device.name, device.type, '', objMessage.attributes, device), apply(sendFunction, apiKey, deviceId)], handleSendConfigurationError);
    } else if (objMessage.type === 'subscription') {
        iotAgentLib.subscribe(device, objMessage.attributes, objMessage.attributes, function (error) {
            if (error) {
                config.getLogger().error(context, 'CONFIG-002: There was an error subscribing device [%s] to attributes [%j]', device.name, objMessage.attributes);
            } else {
                config.getLogger().debug(context, 'Successfully subscribed device [%s] to attributes[%j]', device.name, objMessage.fields);
            }

            callback(error);
        });
    } else {
        config.getLogger().error(context, 'CONFIG-003: Unknown command type from device [%s]: %s', device.name, objMessage.type);
        callback();
    }
}

function createConfigurationNotification(results) {
    const configurations = {};
    const now = new Date();

    // If it is the result of a subscription, results is an array
    if (Array.isArray(results)) {
        for (let i = 0; i < results.length; i++) {
            configurations[results[i].name] = results[i].value;
        }
    } else {
        for (var att in results) {
            configurations[att] = results[att].value;
        }
    }

    configurations.dt = dateFormat(now, constants.DATE_FORMAT);
    return configurations;
}

exports.createConfigurationNotification = createConfigurationNotification;
exports.getEffectiveApiKey = getEffectiveApiKey;
exports.manageConfiguration = manageConfiguration;
exports.retrieveDevice = retrieveDevice;
exports.updateCommand = updateCommand;
