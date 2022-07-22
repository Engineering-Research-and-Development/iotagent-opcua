const { exit } = require('yargs');

module.exports = {
    objectFolder: async function(data, configJson, crawler, properties) {
        var ignoreNs = properties.get('namespace-ignore');
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
            if (
                data.organizes[l].hasOwnProperty('hasComponent') ||
                data.organizes[l].hasOwnProperty('organizes') ||
                data.organizes[l].hasOwnProperty('hasProperty')
            ) {
                //console.log(data.organizes[i].nodeId.toString());
                recursiveNodeCrawling(data.organizes[l].nodeId, name);
            }
        }

        async function recursiveNodeCrawling(nodeId, name) {
            const browseSubLev = await crawler.read(nodeId);
            const ignoreNodeId = await nodeIDParser.nodeIDParser(browseSubLev.nodeId, ignoreNs);
            var command = {};
            var activeAttr = {};
            var contextMapping = {};
            var contextSubscription = {};

            if (!ignoreNodeId) {
                if (!browseSubLev.hasOwnProperty('dataValue') && !browseSubLev.hasOwnProperty('hasComponent')) {
                    //console.log("Method " + browseSubLev.browseName)
                    command = {
                        name: name + '_' + browseSubLev.browseName,
                        type: 'command'
                    };

                    contextSubscription = {
                        ocb_id: name + '_' + browseSubLev.browseName,
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
                                input = {
                                    dataType: browseSubLev.hasProperty[m].dataValue.value.value[0].dataType
                                        .split(';')[1]
                                        .split('=')[1],
                                    type: browseSubLev.hasProperty[m].dataValue.value.value[0].name
                                };
                            }
                            inputArguments.push(input);
                        }
                        contextSubscription.inputArguments = inputArguments;
                    }
                    contextSubscriptionsMapping.push(contextSubscription);
                    commands.push(command);
                } else {
                    if (
                        browseSubLev.hasOwnProperty('hasComponent') ||
                        browseSubLev.hasOwnProperty('organizes') ||
                        browseSubLev.hasOwnProperty('hasProperty')
                    ) {
                        if (browseSubLev.hasOwnProperty('hasComponent')) {
                            for (i in browseSubLev.hasComponent) {
                                //  console.log(browseSubLev.hasComponent[i].nodeId.toString() + " " + browseSubLev.hasComponent[i].browseName.toString());
                                if (browseSubLev.hasOwnProperty('hasComponent')) {
                                    recursiveNodeCrawling(
                                        browseSubLev.hasComponent[i].nodeId,
                                        name + '_' + browseSubLev.browseName
                                    );
                                }
                            }
                        }

                        if (browseSubLev.hasOwnProperty('organizes')) {
                            for (j in browseSubLev.organizes) {
                                if (browseSubLev.hasOwnProperty('organizes')) {
                                    recursiveNodeCrawling(
                                        browseSubLev.organizes[j].nodeId,
                                        name + '_' + browseSubLev.browseName
                                    );
                                }
                            }
                        }

                        if (browseSubLev.hasOwnProperty('hasProperty')) {
                            for (k in browseSubLev.hasProperty) {
                                if (browseSubLev.hasOwnProperty('hasProperty')) {
                                    browseSubLev.hasOwnProperty('hasProperty');
                                    recursiveNodeCrawling(
                                        browseSubLev.hasProperty[k].nodeId,
                                        name + '_' + browseSubLev.browseName
                                    );
                                }
                            }
                        }
                    } else {
                        //console.log(browseSubLev.nodeId + " " + name + "_" + browseSubLev.browseName);

                        activeAttr = {
                            name: name + '_' + browseSubLev.browseName,
                            type: browseSubLev.dataValue.value.dataType
                        };

                        contextMapping = {
                            ocb_id: name + '_' + browseSubLev.browseName,
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
            service: properties.get('fiware-service'),
            subservice: properties.get('fiware-service-path'),
            active: active,
            lazy: lazy,
            commands: commands
        };

        configJson.types = obj;

        context['id'] = properties.get('entity-id');
        context['type'] = 'Device';
        context['service'] = properties.get('fiware-service');
        context['subservice'] = properties.get('fiware-service-path');
        context['polling'] = properties.get('polling');
        context['mappings'] = [];
        context.mappings = contexts;
        configJson.contexts.push(context);
        contextSubscriptions['id'] = properties.get('entity-id');
        contextSubscriptions['type'] = 'Device';
        contextSubscriptions['mappings'] = [];
        contextSubscriptions.mappings = contextSubscriptionsMapping;
        configJson.contextSubscriptions.push(contextSubscriptions);

        return configJson;
    }
};
