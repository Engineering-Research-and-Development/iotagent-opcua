var exports = (module.exports = {});
process.env.NODE_ENV = process.env.NODE_ENV;
var express = require('express');
var config = require('./server');
// var PropertiesReader = require('properties-reader');
// var properties = PropertiesReader('./conf/config.properties');
var app = express();

exports.start = function() {
    // Setup server
    var server = require('http').createServer(app);
    require('./routes')(app);
    var ipaddr = properties.get('api-ip');
    var port = properties.get('api-port');
    var logger = require('logops');
    // Start server
    server.listen(port, ipaddr, function() {
        logger.info('Express server listening on %s:%d', server.address().address, server.address().port);
    });

    process.on('uncaughtException', function(err) {
        if (err.errno === 'EACCES') logger.error('Invalid port number, check configuration file');
        if (err.errno === 'ENOTFOUND') logger.error('Invalid ip address, check configuration file');
        else logger.error(err);
        process.exit(1);
    });
};
// Expose app
exports.app = app;
