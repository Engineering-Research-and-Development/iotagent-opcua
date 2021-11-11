module.exports = {
    nodesCrawler: async function(mySession, data, crawler, properties, configJson) {
        var nodeIDParser = require('./nodeIDParser');
        var ignoreNs = properties.get('namespace-ignore');

        //console.log(await crawler.read("i=86"));

        /*const leaf = await crawler.read();
    console.log(data);*/

        switch (data.browseName.toLowerCase()) {
            case 'objects':
                var obj = {};
                for (i in data.organizes) {
                    const ignoreNodeId = nodeIDParser.nodeIDParser(data.organizes[i].nodeId, ignoreNs);
                    if (!ignoreNodeId) {
                        const browseSubLev2 = await crawler.read(data.organizes[i].nodeId);
                        console.log(data.organizes[i]);
                        if (browseSubLev2.hasOwnProperty('hasComponent')) {
                            var active = [];
                            var lazy = [];
                            var commands = [];
                            for (k in browseSubLev2.hasComponent) {
                                const ignoreNodeIdSubLev2 = nodeIDParser.nodeIDParser(
                                    browseSubLev2.hasComponent[k].nodeId,
                                    ignoreNs
                                );
                                if (!ignoreNodeIdSubLev2) {
                                    console.log('mmiaComponent');
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
                console.log('Browsing Objects Folder');
                break;

            case 'types':
                console.log('Browsing Types Folder');
                break;

            case 'views':
                console.log('Browsing Views Folder');
                break;

            default:
                console.log(`Nothing to be browsed`);
        }

        return configJson;
    }
};
