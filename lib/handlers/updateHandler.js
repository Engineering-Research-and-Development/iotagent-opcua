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

const config = require('../configService');
const transportSelector = require('../transportSelector');
const iotAgentLib = require('iotagent-node-lib');
const iotaUtils = require('../iotaUtils');
const async = require('async');
const context = {
    op: 'IoTAgentOPCUA.UpdateHandler'
};

/**
 * Generate a function that executes the given update in the device.
 *
 * @param {String} apiKey           APIKey of the device's service or default APIKey.
 * @param {Object} device           Object containing all the information about a device.
 * @param {Object} attribute        Attribute in NGSI format.
 * @return {Function}               Query execution function ready to be called with async.series.
 */
function generateUpdateExecution(apiKey, device, attribute) {
    config.getLogger().debug(context, 'Sending update execution to device [%s] with apikey [%s] and attribute [%s]', device.id, apiKey, attribute);

    const executions = transportSelector.createExecutionsForBinding([apiKey, device, attribute], 'executeUpdate', device.transport || config.getConfig().defaultTransport);

    return executions;
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
    config.getLogger().debug(context, 'Handling update %j for device [%s] in service [%s - %s]', attributes, id, service, subservice);
    function concat(previous, current) {
        previous = previous.concat(current);
        return previous;
    }
    
    iotAgentLib.getDeviceByNameAndType(id, type, service, subservice, function (error, device) {
        if (error) {
            config.getLogger().error(context, "UPDATE-001: Update execution could not be handled, as device for entity [%s] [%s] wasn't found", id, type);
            callback(error);
        } else {
            iotaUtils.getEffectiveApiKey(device.service, device.subservice, device, function (error, apiKey) {
                if (error) {
                    callback(error);
                } else {
                    const funcList = attributes.map(generateUpdateExecution.bind(null, apiKey, device)).reduce(concat, []);
                    async.series(funcList, function (err, results) {
                        /* istanbul ignore if */
                        if (err) {
                            config.getLogger().error(context, 'UPDATE-002: Update execution could not be handled, [%s]', err);
                        }
                    });
                }
            });
        }
    });
    callback();
}

exports.handler = updateHandler;
