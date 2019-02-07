const opcua = require('node-opcua');

try {
    const fs = require('fs');
    if (fs.existsSync('./conf/config.json')) {
        var config = require('./conf/config.json');
        console.log('Configuration file found!');
    } else {
        console.log('Configuration file not found!');
    }
} catch (ex) {
    console.log(ex);
    console.log('Configuration not found...closing application...'.red);
    process.exit(1);
}
module.exports = config;
