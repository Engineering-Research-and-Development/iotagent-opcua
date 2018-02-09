/*
 * Copyright 2015 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::daniel.moranjimenez@telefonica.com
 */

'use strict';

var request = require('request'),
    async = require('async'),
    apply = async.apply,
    uuid = require('node-uuid'),
    constants = require('../../constants'),
    domain = require('domain'),
    intoTrans = require('../common/domain').intoTrans,
    alarms = require('../common/alarmManagement'),
    groupService = require('../groups/groupService'),
    errors = require('../../errors'),
    logger = require('logops'),
    config = require('../../commonConfig'),
    ngsiParser = require('./../ngsi/ngsiParser'),
    registrationUtils = require('./registrationUtils'),
    subscriptions = require('../ngsi/subscriptionService'),
    _ = require('underscore'),
    utils = require('../northBound/restUtils'),
    context = {
        op: 'IoTAgentNGSI.DeviceService'
    };

/**
 * Process the response from a Register Context request for a device, extracting the 'registrationId' and creating the
 * device object that will be stored in the registry.
 *
 * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
 *
 */
function processContextRegistration(deviceData, body, callback) {
    var newDevice = _.clone(deviceData);

    if (body) {
        newDevice.registrationId = body.registrationId;
    }

    callback(null, newDevice);
}

/**
 * Creates the response handler for the initial entity creation request. This handler basically deals with the errors
 * that could have been rised during the communication with the Context Broker.
 *
 * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
 * @param {Object} newDevice        Device object that will be stored in the database.
 * @return {function}               Handler to pass to the request() function.
 */
function createInitialEntityHandler(deviceData, newDevice, callback) {
    return function handleInitialEntityResponse(error, response, body) {
        if (error) {
            logger.error(context,
                'ORION-001: Connection error creating inital entity in the Context Broker: %s', error);

            alarms.raise(constants.ORION_ALARM, error);

            callback(error);
        } else if (response && body && response.statusCode === 200) {
            var errorField = ngsiParser.getErrorField(body);

            if (errorField) {
                logger.error(context, 'Update error connecting to the Context Broker: %j', errorField);
                callback(new errors.BadRequest(JSON.stringify(errorField)));
            } else {
                alarms.release(constants.ORION_ALARM);
                logger.debug(context, 'Initial entity created successfully.');
                callback(null, newDevice);
            }
        } else {
            var errorObj;

            logger.error(context,
                'Protocol error connecting to the Context Broker [%d]: %s', response.statusCode, body);

            errorObj = new errors.EntityGenericError(deviceData.id, deviceData.type, body);

            callback(errorObj);
        }
    };
}

function getInitialValueForType(type) {
    switch (type) {
        case constants.LOCATION_TYPE:
            return constants.LOCATION_DEFAULT;
        case constants.DATETIME_TYPE:
            return constants.DATETIME_DEFAULT;
        default:
            return constants.ATTRIBUTE_DEFAULT;
    }
}

/**
 * Creates the initial entity representing the device in the Context Broker. This is important mainly to allow the
 * rest of the updateContext operations to be performed using an UPDATE action instead of an APPEND one.
 *
 * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
 * @param {Object} newDevice        Device object that will be stored in the database.
 */
function createInitialEntity(deviceData, newDevice, callback) {
    var options = {
            url: 'http://' + config.getConfig().contextBroker.host + ':' + config.getConfig().contextBroker.port +
                '/v1/updateContext',
            method: 'POST',
            json: {
                contextElements: [
                    {
                        type: deviceData.type,
                        isPattern: 'false',
                        id: String(deviceData.id),
                        attributes: []
                    }
                ],
                updateAction: 'APPEND'
            },
            headers: {
                'fiware-service': deviceData.service,
                'fiware-servicepath': deviceData.subservice,
                'fiware-correlator': (domain.active && domain.active.corr) || uuid.v4()
            }
        };

    function formatAttributes(originalVector) {
        var attributeList = [];

        if (originalVector && originalVector.length) {
            for (var i = 0; i < originalVector.length; i++) {
                attributeList.push({
                    name: originalVector[i].name,
                    type: originalVector[i].type,
                    value: getInitialValueForType(originalVector[i].type)
                });
            }
        }

        return attributeList;
    }

    function formatCommands(originalVector) {
        var attributeList = [];

        if (originalVector && originalVector.length) {
            for (var i = 0; i < originalVector.length; i++) {
                attributeList.push({
                    name: originalVector[i].name + constants.COMMAND_STATUS_SUFIX,
                    type: constants.COMMAND_STATUS,
                    value: 'UNKNOWN'
                });
                attributeList.push({
                    name: originalVector[i].name + constants.COMMAND_RESULT_SUFIX,
                    type: constants.COMMAND_RESULT,
                    value: ' '
                });
            }
        }

        return attributeList;
    }

    options.json.contextElements[0].attributes = [].concat(
        formatAttributes(deviceData.active),
        //GAB
        //formatAttributes(deviceData.lazy),

        //GAB//deviceData.staticAttributes,
        formatCommands(deviceData.commands));

    if (config.getConfig().timestamp && ! utils.isTimestamped(options.json)) {
        options.json.contextElements[0].attributes.push({
            name: constants.TIMESTAMP_ATTRIBUTE,
            type: constants.TIMESTAMP_TYPE,
            value: ' '
        });
    }

    logger.debug(context, 'Creating initial entity in the Context Broker:\n %s', JSON.stringify(options, null, 4));

    request(options, createInitialEntityHandler(deviceData, newDevice, callback));
}

/**
 * If the object_id or the name of the attribute is missing, complete it with the other piece of data.
 *
 * @param {Object} attribute            Device attribute
 * @return {*}                          Completed attribute
 */
function setDefaultAttributeIds(attribute) {
    /* jshint camelcase: false */

    if (!attribute.object_id && attribute.name) {
        attribute.object_id = attribute.name;
    }

    if (!attribute.name && attribute.object_id) {
        attribute.name = attribute.object_id;
    }

    return attribute;
}

/**
 * Merge array of attributes coming from the device with another one coming from a configuration. The latter will
 * complete the information in the former if the attribute in the configuration:
 * - does not have a conflicting object_id with any attribute of the device.
 * - does not have a conflicting name with any other attribute in the device
 *
 * @param {Array} original              List of attributes of the device.
 * @param {Array} newArray              List of attributes of the configuration.
 * @return {Array}                      Merge of the attributes of the device and those of the configuration.
 */
function mergeArrays(original, newArray) {
    /* jshint camelcase: false */
    var originalKeys = _.pluck(original, 'object_id'),
        newKeys = _.pluck(newArray, 'object_id'),
        addedKeys = _.difference(newKeys, originalKeys),
        differenceArray = newArray.filter(function(item) {
            return addedKeys.indexOf(item.object_id) >= 0;
        }),
        originalNames = _.pluck(original, 'name'),
        newNames = _.pluck(newArray, 'name'),
        addedNames = _.difference(newNames, originalNames),
        differenceNamesArray = newArray.filter(function(item) {
            return addedNames.indexOf(item.name) >= 0 && (!item.object_id || newKeys.indexOf(item.object_id) < 0);
        });

    return original.concat(differenceArray).concat(differenceNamesArray);
}

/**
 * Complete the information of the device with the information in the configuration group (with precedence of the
 * device). The first argument indicates what fields would be merged.
 *
 * @param {Object} fields               Fields that will be merged.
 * @param {Object} deviceData           Device data.
 * @param {Object} configuration        Configuration data.
 */
function mergeDeviceWithConfiguration(fields, defaults, deviceData, configuration, callback) {
    for (var i = 0; i < fields.length; i++) {
        var confField = (fields[i] === 'active') ? 'attributes' : fields[i];

        if (deviceData && deviceData[fields[i]] && ['active', 'lazy', 'commands'].indexOf(fields[i]) >= 0) {
            deviceData[fields[i]] = deviceData[fields[i]].map(setDefaultAttributeIds);
        } else if (deviceData && deviceData[fields[i]] && ['internalAttributes'].indexOf(fields[i]) >= 0) {
            if (!(deviceData[fields[i]] instanceof Array)) {
                deviceData[fields[i]] = [deviceData[fields[i]]];
            }
        }

        if (configuration && configuration[confField] && ['attributes', 'lazy', 'commands'].indexOf(confField) >= 0) {
            configuration[confField] = configuration[confField].map(setDefaultAttributeIds);
        } else if (configuration && configuration[confField] && ['internalAttributes'].indexOf(confField) >= 0) {
            if (!(configuration[confField] instanceof Array)) {
                configuration[confField] = [configuration[confField]];
            }
        }


        if (deviceData[fields[i]] && configuration && configuration[confField]) {
            deviceData[fields[i]] = mergeArrays(deviceData[fields[i]], configuration[confField]);
        } else if (!deviceData[fields[i]] && configuration && configuration[confField]) {
            deviceData[fields[i]] = configuration[confField];
        } else if (!deviceData[fields[i]] && (!configuration || !configuration[confField])) {
            deviceData[fields[i]] = defaults[i];
             //GAB per censire su ORION gli attributi active
             deviceData[fields[i]] = configuration[fields[i]];
             //END GABR
        }
    }

    callback(null, deviceData);
}

/**
 * Find the configuration group belonging to a given device, with a different criteria depending on whether the
 * agent is in single configuration mode or node.
 *
 * @param {Object} deviceObj        Device data.
 */
function findConfigurationGroup(deviceObj, callback) {

    function handlerGroupFind(error, group) {
        var effectiveGroup = group;

        if (!group && config.getConfig().types[deviceObj.type]) {
            effectiveGroup = config.getConfig().types[deviceObj.type];
        } else if (!group) {
            effectiveGroup = deviceObj;
        }

        callback(null, effectiveGroup);
    }

    if (config.getConfig().singleConfigurationMode) {
        config.getGroupRegistry().find(
            deviceObj.service,
            deviceObj.subservice,
            handlerGroupFind);
    } else {
        config.getGroupRegistry().findBy(['service', 'subservice', 'type'])(
            deviceObj.service,
            deviceObj.subservice,
            deviceObj.type,
            handlerGroupFind);
    }
}

/**
 * Register a new device identified by the Id and Type in the Context Broker, and the internal registry.
 *
 * The device id and type are required fields for any registration. The rest of the parameters are optional, but, if
 * they are not present in the function call arguments, the type must be registered in the configuration, so the
 * service can infer their default values from the configured type. If an optional attribute is not given in the
 * parameter list and there isn't a default configuration for the given type, a TypeNotFound error is raised.
 *
 * When an optional parameter is not included in the call, a null value must be given in its place.
 *
 * @param {Object} deviceObj                    Object with all the device information (mandatory).
 */
function registerDevice(deviceObj, callback) {

    function checkDuplicates(deviceObj, innerCb) {
        config.getRegistry().get(deviceObj.id, deviceObj.service, deviceObj.subservice, function(error, device) {
            if (!error) {
                innerCb(new errors.DuplicateDeviceId(deviceObj.id));
            } else {
                innerCb();
            }
        });
    }

    function prepareDeviceData(deviceObj, configuration, callback) {
        var deviceData = _.clone(deviceObj),
            selectedConfiguration;

        if (!deviceData.type) {
            if (configuration && configuration.type) {
                deviceData.type = configuration.type;
            } else {
                deviceData.type = config.getConfig().defaultType;
            }
        }

        if (!deviceData.name) {
            deviceData.name = deviceData.type + ':' + deviceData.id;
            logger.debug(context, 'Device name not found, falling back to deviceId:type [%s]', deviceData.name);
        }

        if (!configuration && config.getConfig().types[deviceData.type]) {
            selectedConfiguration = config.getConfig().types[deviceData.type];
        } else {
            selectedConfiguration = configuration;
        }

        callback(null, deviceData, selectedConfiguration);
    }

	//GAB

	
				 deviceObj.service = config.getConfig().service;
                deviceObj.subservice =config.getConfig().subservice;



	//END GAB
    function completeRegistrations(error, deviceData) {
        if (error) {
            return callback(error);
        }

        logger.debug(context, 'Registering device into NGSI Service:\n%s', JSON.stringify(deviceData, null, 4));

        async.waterfall([
            apply(registrationUtils.sendRegistrations, false, deviceData),
            apply(processContextRegistration, deviceData),
            apply(createInitialEntity, deviceData)
        ], function(error, results) {
            if (error) {
                callback(error);
            } else {
                deviceObj.registrationId = results.registrationId;
                deviceObj.name = deviceData.name;
                deviceObj.service = deviceData.service;
                deviceObj.subservice = deviceData.subservice;
                deviceObj.type = deviceData.type;
                config.getRegistry().store(deviceObj, callback);
            }
        });
    }



    async.waterfall([
        apply(checkDuplicates, deviceObj),
        apply(findConfigurationGroup, deviceObj),
        apply(prepareDeviceData, deviceObj),
        apply(mergeDeviceWithConfiguration,
            [
                'lazy',
                'active',
                'staticAttributes',
                'commands',
                'subscriptions'
            ],
            [null, null, [], [], [], [], []]
        )
    ], completeRegistrations);
}

function removeAllSubscriptions(device, callback) {
    function removeSubscription(subscription, callback) {
        subscriptions.unsubscribe(device, subscription.id, callback);
    }

    if (device.subscriptions) {
        async.map(device.subscriptions, removeSubscription, callback);
    } else {
        callback(null, {});
    }
}

/**
 * Unregister a device from the Context broker and the internal registry.
 *
 * @param {String} id           Device ID of the device to register.
 * @param {String} service      Service of the device to unregister.
 * @param {String} subservice   Subservice inside the service for the unregisterd device.
 */
function unregisterDevice(id, service, subservice, callback) {
    function processContextUnregister(body, innerCallback) {
        innerCallback(null);
    }

    function processUnsubscribes(device, innerCallback) {
        innerCallback(null);
    }

    logger.debug(context, 'Removing device register in Device Service');

    config.getRegistry().get(id, service, subservice, function(error, device) {
        async.waterfall([
            apply(findConfigurationGroup, device),
            apply(mergeDeviceWithConfiguration,
                [
                    'lazy',
                    'active',
                    'staticAttributes',
                    'commands',
                    'subscriptions'
                ],
                [null, null, [], [], [], [], []],
                device
            )
        ], function(error, mergedDevice) {
            if (error) {
                callback(error);
            } else {
                async.waterfall([
                    apply(removeAllSubscriptions, mergedDevice),
                    processUnsubscribes,
                    apply(registrationUtils.sendRegistrations, true, mergedDevice),
                    processContextUnregister,
                    apply(config.getRegistry().remove, id, service, subservice)
                ], callback);
            }
        });
    });
}

/**
 * Updates the register of an existing device identified by the Id and Type in the Context Broker, and the internal
 * registry.
 *
 * The device id and type are required fields for a registration updated. Only the following attributes will be
 * updated: lazy, active and internalId. Any other change will be ignored. The registration for the lazy attributes
 * of the updated entity will be updated if existing, and created if not. If new active attributes are created,
 * the entity will be updated creating the new attributes.
 *
 * @param {Object} deviceObj                    Object with all the device information (mandatory).
 */
function updateRegisterDevice(deviceObj, callback) {
    if (!deviceObj.id || !deviceObj.type) {
        callback(new errors.MissingAttributes('Id or device missing'));
        return;
    }

    logger.debug(context, 'Update provisioned device in Device Service');

    function combineWithNewDevice(newDevice, oldDevice, callback) {
        if (oldDevice) {
            oldDevice.internalId = newDevice.internalId;
            oldDevice.lazy = newDevice.lazy;
            oldDevice.commands = newDevice.commands;
            oldDevice.staticAttributes = newDevice.staticAttributes;
            oldDevice.active = newDevice.active;
            oldDevice.name = newDevice.name;
            oldDevice.type = newDevice.type;
            oldDevice.polling = newDevice.polling;
            oldDevice.timezone = newDevice.timezone;
            oldDevice.endpoint = newDevice.endpoint || oldDevice.endpoint;

            callback(null, oldDevice);
        } else {
            callback(new errors.DeviceNotFound(newDevice.id));
        }
    }

    function getAttributeDifference(oldArray, newArray) {
        var oldActiveKeys,
            newActiveKeys,
            updateKeys,
            result;

        if (oldArray && newArray) {
            newActiveKeys = _.pluck(newArray, 'name');
            oldActiveKeys = _.pluck(oldArray, 'name');

            updateKeys = _.difference(newActiveKeys, oldActiveKeys);

            result = newArray.filter(function(attribute) {
                return updateKeys.indexOf(attribute.name) >= 0;
            });
        } else if (newArray) {
            result = newArray;
        } else {
            result = [];
        }

        return result;
    }

    function extractDeviceDifference(newDevice, oldDevice, callback) {
        var deviceData = {
                id: oldDevice.id,
                name: oldDevice.name,
                type: oldDevice.type,
                service: oldDevice.service,
                subservice: oldDevice.subservice
            };

        deviceData.active = getAttributeDifference(oldDevice.active, newDevice.active);
        deviceData.lazy = getAttributeDifference(oldDevice.lazy, newDevice.lazy);
        deviceData.commands = getAttributeDifference(oldDevice.commands, newDevice.commands);
        deviceData.staticAttributes = getAttributeDifference(oldDevice.staticAttributes, newDevice.staticAttributes);

        callback(null, deviceData, oldDevice);
    }

    async.waterfall([
        apply(config.getRegistry().get, deviceObj.id, deviceObj.service, deviceObj.subservice),
        apply(extractDeviceDifference, deviceObj),
        createInitialEntity,
        apply(combineWithNewDevice, deviceObj),
        apply(registrationUtils.sendRegistrations, false),
        apply(processContextRegistration, deviceObj),
        config.getRegistry().update
    ], callback);
}

/**
 * Return a list of all the devices registered in the system. This function can be invoked in three different ways:
 * with just one parameter (the callback) with three parameters (service, subservice and callback) or with five
 * parameters (including limit and offset).
 *
 * @param {String} service      Service for which the devices are requested.
 * @param {String} subservice   Subservice inside the service for which the devices are requested.
 * @param {Number} limit        Maximum number of entries to return.
 * @param {Number} offset       Number of entries to skip for pagination.
 */
function listDevices(service, subservice, limit, offset, callback) {
    if (!callback) {
        if (service && subservice && limit) {
            callback = limit;
        } else if (service) {
            callback = service;
            service = null;
            subservice = null;
        } else {
            logger.fatal(context, 'GENERAL-001: Couldn\'t find callback in listDevices() call.');
        }
    }

    config.getRegistry().list(service, subservice, limit, offset, callback);
}

/**
 * Retrieve a device from the device registry.
 *
 * @param {String} deviceId         ID of the device to be found.
 * @param {String} service          Service for which the requested device.
 * @param {String} subservice       Subservice inside the service for which the device is requested.
 */
function getDevice(deviceId, service, subservice, callback) {
    config.getRegistry().get(deviceId, service, subservice, callback);
}

/**
 * Clear all the information in the registry.
 */
function clearRegistry(callback) {
    config.getRegistry().clear(callback);
}

/**
 * Retrieve a device from the registry based on its entity name.
 *
 * @param {String} deviceName       Name of the entity associated to a device.
 * @param {String} service          Service the device belongs to.
 * @param {String} subservice       Division inside the service.
 */
function getDeviceByName(deviceName, service, subservice, callback) {
    config.getRegistry().getByName(deviceName, service, subservice, callback);
}

/**
 * Retrieve a device from the registry based on the value of a given attribute.
 *
 * @param {String} attributeName       Name of the attribute to perform the search with.
 * @param {String} attributeValue      Value of the attribute to perform the selection.
 * @param {String} service             Service the device belongs to.
 * @param {String} subservice          Division inside the service.
 */
function getDevicesByAttribute(attributeName, attributeValue, service, subservice, callback) {
    config.getRegistry().getDevicesByAttribute(attributeName, attributeValue, service, subservice, callback);
}

/**
 * Wraps a function, throwing an exception if the function is invoked before the registry is initialized.
 *
 * @param {Function} fn                 Original function to wrap.
 * @return {Function}                   Wrapped function.
 */
function checkRegistry(fn) {
    return function() {
        var args = Array.prototype.slice.call(arguments),
            callbacks = args.slice(-1);

        if (config.getRegistry()) {
            fn.apply(null, args);
        } else if (callbacks && callbacks.length === 1 && (typeof callbacks[0] === 'function')) {
            logger.error(context, 'Tried to access device information before a registry was available');
            callbacks[0](new errors.RegistryNotAvailable());
        } else {
            logger.error(context, 'Tried to access device information without providing a callback');
        }
    };
}


function findOrCreate(deviceId, group, callback) {
    getDevice(deviceId, group.service, group.subservice, function(error, device) {
        if (!error && device) {
            callback(null, device, group);
        } else if (error.name === 'DEVICE_NOT_FOUND') {
            var newDevice = {
                id: deviceId,
                service: group.service,
                subservice: group.subservice,
                type: group.type
            };

            if (config.getConfig().iotManager && config.getConfig().iotManager.protocol) {
                newDevice.protocol = config.getConfig().iotManager.protocol;
            }

            registerDevice(newDevice, function(error, device) {
                callback(error, device, group);
            });
        } else {
            callback(error);
        }
    });
}

/**
 * Retrieve a device from the device repository based on the given APIKey and DeviceID, creating one if none is
 * found for the given data.
 *
 * @param {String} deviceId         Device ID of the device that wants to be retrieved or created.
 * @param {String} apiKey           APIKey of the Device Group (or default APIKey).
 */
function retrieveDevice(deviceId, apiKey, callback) {
    if (apiKey === config.getConfig().defaultKey) {
        getDevicesByAttribute('id', deviceId, null, null, function(error, devices) {
            if (error) {
                callback(error);
            } else if (devices && devices.length === 1) {
                callback(null, devices[0]);
            } else {
                logger.error(context, 'Couldn\'t find device data for APIKey [%s] and DeviceId[%s]',
                    deviceId, apiKey);

                callback(new errors.DeviceNotFound(deviceId));
            }
        });
    } else {
        async.waterfall([
            apply(groupService.get, config.getConfig().defaultResource || '', apiKey),
            apply(findOrCreate, deviceId),
            apply(mergeDeviceWithConfiguration,
                [
                    'lazy',
                    'active',
                    'staticAttributes',
                    'commands',
                    'subscriptions'
                ],
                [null, null, [], [], [], [], []]
            )
        ], callback);
    }
}

exports.listDevices = intoTrans(context, checkRegistry)(listDevices);
exports.getDevice = intoTrans(context, checkRegistry)(getDevice);
exports.getDevicesByAttribute = intoTrans(context, checkRegistry)(getDevicesByAttribute);
exports.getDeviceByName = intoTrans(context, checkRegistry)(getDeviceByName);
exports.register = intoTrans(context, registerDevice);
exports.updateRegister = intoTrans(context, updateRegisterDevice);
exports.unregister = intoTrans(context, unregisterDevice);
exports.clearRegistry = intoTrans(context, checkRegistry)(clearRegistry);
exports.retrieveDevice = intoTrans(context, checkRegistry)(retrieveDevice);
exports.mergeDeviceWithConfiguration = mergeDeviceWithConfiguration;
exports.findConfigurationGroup = findConfigurationGroup;
