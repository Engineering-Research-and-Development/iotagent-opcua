module.exports = {
    nodesCrawler: async function(mySession, data, crawler, properties, configJson) {
        var dataTypes = require('./dataTypes');
        var objectFolder = require('./objectFolder');

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
