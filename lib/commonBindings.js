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

/* eslint-disable no-prototype-builtins */

const iotAgentLib = require('iotagent-node-lib');
const intoTrans = iotAgentLib.intoTrans;
const finishSouthBoundTransaction = iotAgentLib.finishSouthBoundTransaction;
const fillService = iotAgentLib.fillService;
const _ = require('underscore');
const commandHandler = require('./handlers/commandHandler');
const transportSelector = require('./transportSelector');
const async = require('async');
const iotaUtils = require('./iotaUtils');
const constants = require('./constants');
const context = {
    op: 'IoTAgentOPCUA.CommonBindings'
};
const config = require('./configService');

/**
 * Parse a message received from a Topic.
 *
 * @param {Buffer} message          Message to be parsed
 * @return {Object}                 Parsed message or null if an error has occurred.
 */
function parseMessage(message) {
    let parsedMessage;
    let parsedMessageError = false;
    let messageArray;

    const stringMessage = message.toString();
    config.getLogger().info(context, 'stringMessage: ' + stringMessage);
    try {
        parsedMessage = JSON.parse(stringMessage);
    } catch (e) {
        parsedMessage = message.toString(16);
    }
    config.getLogger().debug(context, 'stringMessage: [%s] parsedMessage: [%s]', stringMessage, parsedMessage);

    /* istanbul ignore if */
    if (parsedMessageError) {
        config.getLogger().error(context, 'MEASURES-003: Impossible to handle malformed message: %s', message);
    }
    config.getLogger().debug(context, 'parserMessage array: %s', messageArray);
    return parsedMessage;
}

/**
 * Find the attribute given by its name between all the active attributes of the given device, returning its type, or
 * null otherwise.
 *
 * @param {String} attribute        Name of the attribute to find.
 * @param {Object} device           Device object containing all the information about a device.
 * @return {String}                 String identifier of the attribute type.
 */
function guessType(attribute, device) {
    if (device.active) {
        for (let i = 0; i < device.active.length; i++) {
            if (device.active[i].name === attribute) {
                return device.active[i].type;
            }
        }
    }

    if (attribute === constants.TIMESTAMP_ATTRIBUTE) {
        return constants.TIMESTAMP_TYPE_NGSI2;
    }
    return constants.DEFAULT_ATTRIBUTE_TYPE;
}

/* istanbul ignore next */
function sendConfigurationToDevice(device, apiKey, deviceId, results, callback) {
    transportSelector.applyFunctionFromBinding([apiKey, deviceId, results], 'sendConfigurationToDevice', device.transport || config.getConfig().defaultTransport, callback);
}

/**
 * Deals with configuration requests coming from the device. Whenever a new configuration requests arrives with a list
 * of attributes to retrieve, this handler asks the Context Broker for the values of those attributes, and publish a
 * new message in the "/1234/MQTT_2/configuration/values" topic
 *
 * @param {String} apiKey           API Key corresponding to the Devices configuration.
 * @param {String} deviceId         Id of the device to be updated.
 * @param {Object} device           Device object containing all the information about a device.
 * @param {Object} objMessage          Array of JSON object received.
 */
/* istanbul ignore next */
function manageConfigurationRequest(apiKey, deviceId, device, objMessage) {
    for (let i = 0; i < objMessage.length; i++) {
        iotaUtils.manageConfiguration(apiKey, deviceId, device, objMessage[i], async.apply(sendConfigurationToDevice, device), function (error) {
            if (error) {
                iotAgentLib.alarms.raise(constants.MQTTB_ALARM, error);
            } else {
                iotAgentLib.alarms.release(constants.MQTTB_ALARM);
                config.getLogger().debug(context, 'Configuration request finished for APIKey [%s] and Device [%s]', apiKey, deviceId);
            }
            finishSouthBoundTransaction(null);
        });
    }
}

/**
 * Adds a single measure to the context broker. The message for single measures contains the direct value to
 * be inserted in the attribute, given by its name.
 *
 * @param {String} apiKey           API Key corresponding to the Devices configuration.
 * @param {String} deviceId         Id of the device to be updated.
 * @param {String} attribute        Name of the attribute to update.
 * @param {Object} device           Device object containing all the information about a device.
 * @param {Object} parsedMessage    ParsedMessage (JSON or string) message coming from the client.
 */
function singleMeasure(apiKey, deviceId, attribute, device, parsedMessage) {
    config.getLogger().debug(context, 'Processing single measure for device [%s] with apiKey [%s]', deviceId, apiKey);

    const messageType = guessType(attribute, device);

    const values = [
        {
            name: attribute,
            type: messageType,
            value: parsedMessage
        }
    ];
    config.getLogger().debug(context, 'values updates [%s]', JSON.stringify(values));
    iotAgentLib.update(device.name, device.type, '', values, device, function (error) {
        context.service = device.service;
        context.subservice = device.subservice;
        if (error) {
            config.getLogger().error(
                context,
                /*jshint quotmark: double */
                "MEASURES-002: Couldn't send the updated values to the Context Broker due to an error: %j",
                /*jshint quotmark: single */
                error
            );
        } else {
            config.getLogger().debug(context, 'Single measure for device [%s] with apiKey [%s] successfully updated', deviceId, apiKey);
        }
        finishSouthBoundTransaction(null);
    });
}

/**
 * Adds multiple measures to the Context Broker. Multiple measures come in the form of single-level JSON objects,
 * whose keys are the attribute names and whose values are the attribute values.
 *
 * @param {String} apiKey           API Key corresponding to the Devices configuration.
 * @param {String} deviceId         Id of the device to be updated.
 * @param {Object} device           Device object containing all the information about a device.
 * @param {Object} messageObj       Array of JSON object sent using.
 */
function multipleMeasures(apiKey, deviceId, device, messageObj) {
    let measure;
    config.getLogger().debug(context, 'Processing multiple measures for device [%s] with apiKey [%s]', deviceId, apiKey);

    for (let j = 0; j < messageObj.length; j++) {
        measure = messageObj[j];
        const values = [];
        for (const i in measure) {
            if (measure.hasOwnProperty(i)) {
                values.push({
                    name: i,
                    type: guessType(i, device),
                    value: measure[i]
                });
            }
        }

        iotAgentLib.update(device.name, device.type, '', values, device, function (error) {
            context.service = device.service;
            context.subservice = device.subservice;
            /* istanbul ignore if */
            if (error) {
                config.getLogger().error(
                    context,
                    /*jshint quotmark: double */
                    "MEASURES-002: Couldn't send the updated values to the Context Broker due to an error: %j",
                    /*jshint quotmark: single */
                    error
                );
            } else {
                config.getLogger().info(context, 'Multiple measures for device [%s] with apiKey [%s] successfully updated', deviceId, apiKey);
            }
            finishSouthBoundTransaction(null);
        });
    }
}

/**
 * Handles an incoming message, extracting the API Key, device Id and attribute to update (in the case of single
 * measures) from the topic.
 *
 * @param {String} topic        Topic of the form: '/<APIKey>/deviceId/attrs[/<attributeName>]'.
 * @param {Object} message      message body (Object or Buffer, depending on the value).
 */
function messageHandler(topic, message, protocol) {
    if (topic[0] !== '/') {
        topic = '/' + topic;
    }
    const topicInformation = topic.split('/');
    if (topicInformation[1].toLowerCase() === 'json') {
        topicInformation.splice(1, 1);
    }
    const apiKey = topicInformation[1];
    const deviceId = topicInformation[2];
    const parsedMessage = parseMessage(message);

    function processMessageForDevice(device, apiKey, topicInformation) {
        /* istanbul ignore if */
        if (topicInformation[3] === 'configuration' && topicInformation[4] === 'commands' && parsedMessage) {
            manageConfigurationRequest(apiKey, deviceId, device, parsedMessage);
        } else if (topicInformation[4]) {
            singleMeasure(apiKey, deviceId, topicInformation[4], device, parsedMessage);
        } else if (topicInformation[3] === constants.CONFIGURATION_COMMAND_UPDATE) {
            for (let i = 0; i < parsedMessage.length; i++) {
                commandHandler.updateCommand(apiKey, deviceId, device, parsedMessage[i]);
            }
        } else if (parsedMessage && Array.isArray(parsedMessage) && parsedMessage.every((x) => typeof x === 'object')) {
            // it must be an array of object
            multipleMeasures(apiKey, deviceId, device, parsedMessage);
        } else {
            /* istanbul ignore next */
            config.getLogger().error(
                context,
                /*jshint quotmark: double */
                "Couldn't process message [%s] due to format issues.",
                /*jshint quotmark: single */
                message
            );
        }
    }

    function processDeviceMeasure(error, device) {
        /* istanbul ignore if */
        if (error) {
            let ctx = context;
            ctx = fillService(ctx, { service: 'n/a', subservice: 'n/a' });
            config.getLogger().warn(ctx, 'MEASURES-004: Device not found for topic [%s]', topic);
        } else {
            const localContext = _.clone(context);

            localContext.service = device.service;
            localContext.subservice = device.subservice;

            intoTrans(localContext, processMessageForDevice)(device, apiKey, topicInformation);
        }
    }

    iotAgentLib.alarms.release(constants.MQTTB_ALARM);
    iotaUtils.retrieveDevice(deviceId, apiKey, protocol, processDeviceMeasure);
}

/**
 * Handles an incoming OPCUA message, extracting the API Key, device Id and attribute to update (in the case of single
 * measures) from the OPCUA topic.
 *
 * @param {String} topic        Topic of the form: '/<APIKey>/deviceId/attributes[/<attributeName>]'.
 * @param {Object} message      OPCUA message body (Object or Buffer, depending on the value).
 */
function opcuaMessageHandler(deviceId, mapping, variableValue, timestamp) {
    const topic = config.getConfig().defaultKey + '/' + deviceId + '/attrs/' + mapping.ocb_id;
    messageHandler(topic, variableValue, 'OPCUA');
}

exports.opcuaMessageHandler = opcuaMessageHandler;
exports.messageHandler = messageHandler;
exports.guessType = guessType;
