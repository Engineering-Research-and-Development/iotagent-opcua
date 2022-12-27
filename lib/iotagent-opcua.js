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

const iotAgentLib = require('iotagent-node-lib');
const transportSelector = require('./transportSelector');
const commandHandler = require('./commandHandler');
const queryHandler = require('./queryHandler');
const iotaUtils = require('./iotaUtils');
const async = require('async');
const errors = require('./errors');
const apply = async.apply;
const config = require('./configService');
const mappingTool = require('./mappingTool/mappingTool');
const { writeValueToOPCUANode } = require('./bindings/OPCUABinding');
const context = {
    op: 'IoTAgentOPCUA.Agent'
};

/**
 * Handler for incoming notifications for the configuration subscription mechanism.
 *
 * @param {Object} device           Object containing all the device information.
 * @param {Array} updates           List of all the updated attributes.

 */
function configurationNotificationHandler(device, updates, callback) {
    function invokeConfiguration(apiKey, callback) {
        transportSelector.applyFunctionFromBinding([apiKey, device.id, updates], 'sendConfigurationToDevice', device.transport || config.getConfig().defaultTransport, callback);
    }

    async.waterfall([apply(iotaUtils.getEffectiveApiKey, device.service, device.subservice, device), invokeConfiguration], callback);
}

function configurationHandler(configuration, callback) {
    if (configuration.resource && config.getConfig().iota.iotManager && config.getConfig().iota.defaultResource && configuration.resource !== config.getConfig().iota.defaultResource) {
        callback(new errors.InvalidResource());
    } else {
        callback();
    }
}

/**
 * Handles incoming updateContext requests related with lazy attributes. This handler is still just registered,
 * but empty.
 *
 * @param {String} id               ID of the entity for which the update was issued.
 * @param {String} type             Type of the entity for which the update was issued.
 * @param {Array} attributes        List of NGSI attributes to update.
 */
async function updateHandler(id, type, service, subservice, attributes, callback) {
    config.getLogger().debug(context, 'updateHandler');

    function filterLazy(device, attrs) {
        let lazySet = [];
        if (device.lazy) {
            lazySet = device.lazy;
        } else if (config.getConfig().iota.types[type] && config.getConfig().iota.types[type].lazy) {
            lazySet = config.getConfig().iota.types[type].lazy;
        }

        const lazyAttrs = [];
        attrs.forEach((attr) => {
            const lazyObject = lazySet.find((lazyAttribute) => lazyAttribute.name === attr);
            if (lazyObject) {
                lazyAttrs.push(attr);
            }
        });

        return lazyAttrs;
    }

    iotAgentLib.getDeviceByName(id, service, subservice, async function (error, device) {
        if (error) {
            config.getLogger().error(
                context,

                "QUERY-001: Query execution could not be handled, as device for entity [%s] [%s] wasn't found",

                id,
                type
            );
            callback(error);
        } else {
            /*const lazyAttributes = filterLazy(device, attributes);
            if( !lazyAttributes) {
                callback();
            }*/
            for (const attribute of attributes) {
                let foundMapping = {};
                for (const context of config.getConfig().iota.contexts) {
                    for (const mapping of context.mappings) {
                        if (mapping.ocb_id === attribute.name) {
                            foundMapping = mapping;
                            break;
                        }
                    }
                }
                // eslint-disable-next-line no-await-in-loop
                const result = await writeValueToOPCUANode(foundMapping.opcua_id, attribute.value);
                if (result !== true) {
                    console.error('UPDATE-001: Some update executions failed, see logs above for details');
                    callback(result);
                } else {
                    callback();
                }
            }
        }
    });
}

function bidirectionalityNotificationHandler(device, updates, callback) {
    transportSelector.applyFunctionFromBinding([device, updates], 'notificationHandler', device.transport || config.getConfig().defaultTransport, callback);
}

/**
 * Calls all the device provisioning handlers for each transport protocol binding whenever a new device is provisioned
 * in the Agent.
 *
 * @param {Object} device           Device provisioning information.
 */
function deviceProvisioningHandler(device, callback) {
    transportSelector.applyFunctionFromBinding([device], 'deviceProvisioningHandler', null, function (error, devices) {
        if (error) {
            callback(error);
        } else {
            callback(null, devices[0]);
        }
    });
}

/**
 * Calls all the device updating handlers for each transport protocol binding whenever a new device is updated
 * in the Agent.
 *
 * @param {Object} device           Device updating information.
 */
function deviceUpdatingHandler(device, callback) {
    transportSelector.applyFunctionFromBinding([device], 'deviceUpdatingHandler', null, function (error, devices) {
        if (error) {
            callback(error);
        } else {
            callback(null, devices[0]);
        }
    });
}

/**
 * Starts the IOTA with the given configuration.
 *
 * @param {Object} newConfig        New configuration object.
 */
async function start(newConfig, callback) {
    config.setLogger(iotAgentLib.logModule);
    config.setConfig(newConfig);

    if (Object.keys(config.getConfig().iota.types).length === 0) {
        config.getLogger().info('----------------    MAPPING TOOL    ----------------');
        const configJS = await mappingTool.mappingTool(config.getConfig());
        //console.log("configJS "+ JSON.stringify(configJS))
        //console.log(JSON.stringify(configJS.types));
        config.getConfig().iota.types = configJS.types;
        config.getConfig().iota.contexts = configJS.contexts;
        config.getConfig().iota.contextSubscriptions = configJS.contextSubscriptions;
    }

    iotAgentLib.activate(config.getConfig().iota, function (error) {
        if (error) {
            callback(error);
        } else {
            config.getLogger().info(context, 'IoT Agent services activated');
            //append config JEXL transformation to built in transformations
            iotAgentLib.dataPlugins.expressionTransformation.setJEXLTransforms(newConfig.jexlTransformations);

            iotAgentLib.setConfigurationHandler(configurationHandler);
            iotAgentLib.setCommandHandler(commandHandler.handler);
            iotAgentLib.setProvisioningHandler(deviceProvisioningHandler);
            iotAgentLib.setUpdatingHandler(deviceUpdatingHandler);
            iotAgentLib.setDataQueryHandler(queryHandler.handler);
            iotAgentLib.setDataUpdateHandler(updateHandler);

            iotAgentLib.addUpdateMiddleware(iotAgentLib.dataPlugins.attributeAlias.update);
            iotAgentLib.addUpdateMiddleware(iotAgentLib.dataPlugins.addEvents.update);

            if (config.getConfig().iota && config.getConfig().iota.compressTimestamp) {
                iotAgentLib.addUpdateMiddleware(iotAgentLib.dataPlugins.compressTimestamp.update);
                iotAgentLib.addQueryMiddleware(iotAgentLib.dataPlugins.compressTimestamp.query);
            }

            iotAgentLib.addUpdateMiddleware(iotAgentLib.dataPlugins.expressionTransformation.update);
            iotAgentLib.addUpdateMiddleware(iotAgentLib.dataPlugins.multiEntity.update);
            iotAgentLib.addUpdateMiddleware(iotAgentLib.dataPlugins.timestampProcess.update);

            iotAgentLib.addDeviceProvisionMiddleware(iotAgentLib.dataPlugins.bidirectionalData.deviceProvision);
            iotAgentLib.addConfigurationProvisionMiddleware(iotAgentLib.dataPlugins.bidirectionalData.groupProvision);
            iotAgentLib.addNotificationMiddleware(iotAgentLib.dataPlugins.bidirectionalData.notification);

            if (config.getConfig().configRetrieval) {
                iotAgentLib.setNotificationHandler(configurationNotificationHandler);
            } else {
                iotAgentLib.setNotificationHandler(bidirectionalityNotificationHandler);
            }

            transportSelector.startTransportBindings(newConfig, callback);
        }
    });
}

/**
 * Stops the current IoT Agent.
 *
 */
function stop(callback) {
    config.getLogger().info(context, 'Stopping IoT Agent');
    async.series([transportSelector.stopTransportBindings, iotAgentLib.resetMiddlewares, iotAgentLib.deactivate], callback);
}

/**
 * Shuts down the IoT Agent in a graceful manner
 *
 */
function handleShutdown(signal) {
    config.getLogger().info(context, 'Received %s, starting shutdown processs', signal);
    stop((err) => {
        if (err) {
            config.getLogger().error(context, err);
            return process.exit(1);
        }
        return process.exit(0);
    });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('SIGHUP', handleShutdown);

exports.start = start;
exports.stop = stop;
