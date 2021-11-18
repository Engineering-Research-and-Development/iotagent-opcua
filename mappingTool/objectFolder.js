module.exports = {
    objectFolder: async function(data, configJson, crawler, properties) {
        var ignoreNs = properties.get('namespace-ignore');
        var nodeIDParser = require('./nodeIDParser');

        var obj = {};
        for (i in data.organizes) {
            const ignoreNodeId = nodeIDParser.nodeIDParser(data.organizes[i].nodeId, ignoreNs);
            if (!ignoreNodeId) {
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

                        console.log(data.organizes[i].hasComponent[k]);
                        if (!ignoreNodeIdSubLev2) {
                            console.log(browseSubLev2.hasComponent[k]);
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
                }
            }
        }
        return configJson;
    }
};
