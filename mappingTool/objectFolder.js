module.exports = {
    objectFolder: async function(data, configJson, crawler, properties) {
        var ignoreNs = properties.get('namespace-ignore');
        var nodeIDParser = require('./nodeIDParser');

        var obj = {};
        var context = {};
        var contextSubscription = {};

        for (i in data.organizes) {
            const ignoreNodeId = nodeIDParser.nodeIDParser(data.organizes[i].nodeId, ignoreNs);
            if (!ignoreNodeId) {
                context['id'] = properties.get('agent-id') + data.organizes[i].browseName;
                context['type'] = data.organizes[i].browseName;
                context['service'] = properties.get('fiware-service');
                context['subservice'] = properties.get('fiware-service-path');
                context['polling'] = properties.get('polling');
                context['mappings'] = [];
                contextSubscription['id'] = properties.get('agent-id') + data.organizes[i].browseName;
                contextSubscription['type'] = data.organizes[i].browseName;
                contextSubscription['mappings'] = [];
                const browseSubLev2 = await crawler.read(data.organizes[i].nodeId);

                if (browseSubLev2.hasOwnProperty('hasComponent')) {
                    var active = [];
                    var lazy = [];
                    var commands = [];

                    for (k in browseSubLev2.hasComponent) {
                        const ignoreNodeIdSubLev2 = nodeIDParser.nodeIDParser(
                            browseSubLev2.hasComponent[k].nodeId,
                            ignoreNs
                        );

                        var comp = {};
                        var mappingContext = {};
                        var mappingContextSub = {};

                        if (
                            !ignoreNodeIdSubLev2 &&
                            data.organizes[i].hasComponent[k].typeDefinition == 'BaseDataVariableType'
                        ) {
                            comp['name'] = data.organizes[i].hasComponent[k].browseName;
                            comp['type'] = data.organizes[i].hasComponent[k].dataValue.value.dataType;
                            active.push(comp);

                            mappingContext['ocb_id'] = data.organizes[i].hasComponent[k].browseName;
                            mappingContext['opcua_id'] = data.organizes[i].hasComponent[k].nodeId;
                            mappingContext['object_id'] = null;
                            mappingContext['inputArguments'] = [];
                            context.mappings.push(mappingContext);
                        } else if (
                            !ignoreNodeIdSubLev2 &&
                            data.organizes[i].hasComponent[k].typeDefinition == 'BaseObjectType'
                        ) {
                            comp = {};
                            mappingContext = {};
                            for (l in data.organizes[i].hasComponent[k].hasComponent) {
                                comp['name'] =
                                    data.organizes[i].hasComponent[k].browseName +
                                    ':' +
                                    data.organizes[i].hasComponent[k].hasComponent[l].browseName;
                                comp['type'] =
                                    data.organizes[i].hasComponent[k].hasComponent[l].dataValue.value.dataType;
                                active.push(comp);
                                comp = {};

                                mappingContext['ocb_id'] =
                                    data.organizes[i].hasComponent[k].browseName +
                                    ':' +
                                    data.organizes[i].hasComponent[k].hasComponent[l].browseName;
                                mappingContext['opcua_id'] = data.organizes[i].hasComponent[k].hasComponent[l].nodeId;
                                mappingContext['object_id'] = null;
                                mappingContext['inputArguments'] = [];
                                context.mappings.push(mappingContext);
                            }
                        } else {
                            mappingContextSub = {};

                            comp['name'] = data.organizes[i].hasComponent[k].browseName;

                            comp['type'] = 'command';
                            commands.push(comp);

                            mappingContextSub['ocb_id'] = data.organizes[i].hasComponent[k].browseName;
                            mappingContextSub['opcua_id'] = data.organizes[i].hasComponent[k].nodeId;
                            mappingContextSub['object_id'] = data.organizes[i].nodeId;
                            mappingContextSub['inputArguments'] = [];

                            if (data.organizes[i].hasComponent[k].hasOwnProperty('hasProperty')) {
                                var inputArg = {};
                                for (ia in data.organizes[i].hasComponent[k].hasProperty) {
                                    if (
                                        data.organizes[i].hasComponent[k].hasProperty[ia].browseName == 'InputArguments'
                                    ) {
                                        inputArg['dataType'] = data.organizes[i].hasComponent[k].hasProperty[
                                            ia
                                        ].dataValue.value.value[0].dataType
                                            .split(';')[1]
                                            .split('=')[1];
                                        inputArg['type'] =
                                            data.organizes[i].hasComponent[k].hasProperty[
                                                ia
                                            ].dataValue.value.value[0].name;
                                        mappingContextSub.inputArguments.push(inputArg);
                                    }
                                }
                            }
                            contextSubscription.mappings.push(mappingContextSub);
                        }
                    }

                    obj[data.organizes[i].browseName] = {
                        service: properties.get('fiware-service'),
                        subservice: properties.get('fiware-service-path'),
                        active: active,
                        lazy: lazy,
                        commands: commands
                    };
                    configJson.types = obj;
                    configJson.contexts.push(context);
                    configJson.contextSubscriptions.push(contextSubscription);
                }
            }
        }
        return configJson;
    }
};
