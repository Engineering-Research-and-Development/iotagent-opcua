module.exports = {
    companionRecognition: async function (mySession) {
        const fsSync = require('fs');
        var path = require('path');

        const companionsFolder = path.join(__dirname, './companions');
        let templates = fsSync.readdirSync(companionsFolder);
        return templates;
    }
};
