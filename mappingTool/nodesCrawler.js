module.exports = {
    nodesCrawler: async function(mySession, data, crawler, properties, configJson) {
        var dataTypes = require('./dataTypes');
        var objectFolder = require('./objectFolder');

        //console.log(await crawler.read("i=86"));

        /*const leaf = await crawler.read();
        console.log(data);*/

        switch (data.browseName.toLowerCase()) {
            case 'objects':
                console.log('Browsing Objects Folder');
                configJson = await objectFolder.objectFolder(data, configJson, crawler, properties);
                break;

            case 'types':
                console.log('Browsing Types Folder');
                const dTypes = await dataTypes.dataTypes(data);
                console.log(dTypes);
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
