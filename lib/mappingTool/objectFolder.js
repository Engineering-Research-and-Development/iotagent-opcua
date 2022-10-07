const { exit } = require('yargs');

module.exports = {
    objectFolder: async function (data, configJson, crawler, configJS) {
        var ignoreNs = configJS.opcua.namespaceIgnore;
        var nodeIDParser = require('./nodeIDParser');

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
                    command = {
                        name: name + browseSubLev.browseName,
                        type: 'command'
                    };

                    contextSubscription = {
                        ocb_id: name + browseSubLev.browseName,
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

                        activeAttr = {
                            name: name + browseSubLev.browseName,
                            type: browseSubLev.dataValue.value.dataType
                        };

                        contextMapping = {
                            ocb_id: name + browseSubLev.browseName,
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

        obj['Device'] = {
            service: configJS.opcua.service,
            subservice: configJS.opcua.subservice,
            active: active,
            lazy: lazy,
            commands: commands
        };

        configJson.types = obj;

        context['id'] = configJS.opcua.entityId;
        context['type'] = 'Device';
        context['service'] = configJS.opcua.service;
        context['subservice'] = configJS.opcua.subservice;
        context['polling'] = configJS.opcua.polling;
        context['mappings'] = [];
        context.mappings = contexts;
        configJson.contexts.push(context);
        contextSubscriptions['id'] = configJS.opcua.entityId;
        contextSubscriptions['type'] = 'Device';
        contextSubscriptions['mappings'] = [];
        contextSubscriptions.mappings = contextSubscriptionsMapping;
        configJson.contextSubscriptions.push(contextSubscriptions);

        return configJson;
    }
};
