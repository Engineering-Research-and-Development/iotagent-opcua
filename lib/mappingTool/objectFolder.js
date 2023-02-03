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

const constants = require('../constants');
const config = require('../configService');
const logContext = {
    op: 'IoTAgentOPCUA.OPCUAMappingTool'
};

async function objectFolder(data, configJson, crawler, configJS) {
    var ignoreNs = configJS.mappingTool.namespaceIgnore;
    const nodeIDParser = require('./nodeIDParser');

    var obj = {};
    var context = {};
    var contexts = [];
    var contextSubscriptions = {};
    var contextSubscriptionsMapping = [];
    var active = [];
    var lazy = [];
    var commands = [];

    for (l in data.organizes) {
        //const data = await crawler.read(reference.nodeId.toString());
        //const browseSubLev2 = await crawler.read("ns=3;s=PLC");
        //console.log(data.organizes[l].nodeId)
        let name = '';
        if (data.organizes[l].hasOwnProperty('hasComponent') || data.organizes[l].hasOwnProperty('organizes') || data.organizes[l].hasOwnProperty('hasProperty')) {
            //console.log(data.organizes[i].nodeId.toString());
            recursiveNodeCrawling(data.organizes[l].nodeId, name);
        }
    }

    async function recursiveNodeCrawling(nodeId, name) {
        const browseSubLev = await crawler.read(nodeId);
        const ignoreNodeId = nodeIDParser.nodeIDParser(browseSubLev.nodeId, ignoreNs);
        var command = {};
        var activeAttr = {};
        var contextMapping = {};
        var contextSubscription = {};

        if (!ignoreNodeId) {
            if (!browseSubLev.hasOwnProperty('dataValue') && !browseSubLev.hasOwnProperty('hasComponent')) {
                //console.log("Method " + browseSubLev.browseName)
                const forbiddenCharacters = [...config.getConfig().iota.extendedForbiddenCharacters, ...constants.FORBIDDEN_NGSI_CHARS];
                config.getLogger().info(logContext, 'Using forbidden characters set: ' + JSON.stringify(forbiddenCharacters));
                var ocb_id = [...(name + browseSubLev.browseName)].map((char) => (forbiddenCharacters.includes(char) ? '' : char)).join('');
                command = {
                    name: ocb_id,
                    type: 'command'
                };

                contextSubscription = {
                    ocb_id: ocb_id,
                    opcua_id: browseSubLev.nodeId,
                    object_id: 'ns=3;i=1000',
                    inputArguments: []
                };

                var inputArguments = [];
                if (browseSubLev.hasOwnProperty('hasProperty')) {
                    for (m in browseSubLev.hasProperty) {
                        var input = {};
                        if (browseSubLev.hasOwnProperty('hasProperty')) {
                            //console.log("Method input " + browseSubLev.hasProperty[m].nodeId, "_" + browseSubLev.browseName);
                            if (browseSubLev.hasProperty[m].hasOwnProperty('dataValue')) {
                                try {
                                    input = {
                                        dataType: parseInt(browseSubLev.hasProperty[m].dataValue.value.value[0].dataType.split(';')[1].split('=')[1]),
                                        type: browseSubLev.hasProperty[m].dataValue.value.value[0].name
                                    };
                                } catch {}
                                if (m == 0) inputArguments.push(input);
                            }
                        }
                    }
                    contextSubscription.inputArguments = inputArguments;
                }
                contextSubscriptionsMapping.push(contextSubscription);
                commands.push(command);
            } else {
                if (browseSubLev.hasOwnProperty('hasComponent') || browseSubLev.hasOwnProperty('organizes') || browseSubLev.hasOwnProperty('hasProperty')) {
                    if (browseSubLev.hasOwnProperty('hasComponent')) {
                        for (i in browseSubLev.hasComponent) {
                            //  console.log(browseSubLev.hasComponent[i].nodeId.toString() + " " + browseSubLev.hasComponent[i].browseName.toString());
                            if (browseSubLev.hasOwnProperty('hasComponent')) {
                                recursiveNodeCrawling(browseSubLev.hasComponent[i].nodeId, name + browseSubLev.browseName);
                            }
                        }
                    }

                    if (browseSubLev.hasOwnProperty('organizes')) {
                        for (j in browseSubLev.organizes) {
                            if (browseSubLev.hasOwnProperty('organizes')) {
                                recursiveNodeCrawling(browseSubLev.organizes[j].nodeId, name + browseSubLev.browseName);
                            }
                        }
                    }

                    if (browseSubLev.hasOwnProperty('hasProperty')) {
                        for (k in browseSubLev.hasProperty) {
                            if (browseSubLev.hasOwnProperty('hasProperty')) {
                                browseSubLev.hasOwnProperty('hasProperty');
                                recursiveNodeCrawling(browseSubLev.hasProperty[k].nodeId, name + browseSubLev.browseName);
                            }
                        }
                    }
                } else {
                    //console.log(browseSubLev.nodeId + " " + name + "_" + browseSubLev.browseName);

                    var ocb_id = [...(name + browseSubLev.browseName)].map((char) => (constants.FORBIDDEN_NGSI_CHARS.includes(char) ? '' : char)).join('');
                    activeAttr = {
                        name: ocb_id,
                        type: browseSubLev.dataValue.value.dataType
                    };

                    contextMapping = {
                        ocb_id: ocb_id,
                        opcua_id: browseSubLev.nodeId,
                        object_id: null,
                        inputArguments: []
                    };

                    context.mappings.push(contextMapping);
                    active.push(activeAttr);
                    return null;
                }
            }
        }
    }

    obj[configJS.mappingTool.entityType] = {
        active: active,
        lazy: lazy,
        commands: commands
    };

    configJson.types = obj;

    context['id'] = configJS.mappingTool.entityId;
    context['type'] = configJS.mappingTool.entityType;
    context['mappings'] = [];
    context.mappings = contexts;
    configJson.contexts.push(context);
    contextSubscriptions['id'] = configJS.mappingTool.entityId;
    contextSubscriptions['type'] = configJS.mappingTool.entityType;
    contextSubscriptions['mappings'] = [];
    contextSubscriptions.mappings = contextSubscriptionsMapping;
    configJson.contextSubscriptions.push(contextSubscriptions);

    return configJson;
}

exports.objectFolder = objectFolder;
