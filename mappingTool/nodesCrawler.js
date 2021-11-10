module.exports = {
    nodesCrawler: async function(mySession, data, crawler, ignoreNs, configJson) {
        var nodeIDParser = require('./nodeIDParser');

        //console.log(await crawler.read("i=86"));

        /*const leaf = await crawler.read();
    console.log(data);*/
        var types = {};
        switch (data.browseName.toLowerCase()) {
            case 'objects':
                for (i in data.organizes) {
                    const ignoreNodeId = nodeIDParser.nodeIDParser(data.organizes[i].nodeId, ignoreNs);
                    if (!ignoreNodeId) {
                        types[data.organizes[i].browseName] = {};
                        const browseSubLev2 = await crawler.read(data.organizes[i].nodeId);
                        console.log('aimm');
                        console.log(data.organizes[i]);
                        if (browseSubLev2.hasOwnProperty('hasComponent')) {
                            console.log('mmiahasComponent');
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

        return types;
    }
};
