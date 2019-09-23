const request = require('request');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(require('path').resolve(__dirname, '../AGECONF/config.properties'));
var testProperties = PropertiesReader(require('path').resolve(__dirname, '../AGECONF/test-file-paths.properties'));
var fs = require('fs');
var config = require(require('path').resolve(__dirname, '../AGECONF/config.json'));

// Set Up
global.logContextTest = {
    comp: 'iotAgent-OPCUA',
    op: 'Test'
};
var loggerTest = require('logops');
loggerTest.format = loggerTest.formatters.pipe;
var exec = require('child_process').exec;
var child;
var hostIP = null;

module.exports = {
    verifyVersionService: function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var versionRequest = {
            url: 'http://' + 'localhost' + ':' + properties.get('test-api-port') + '/version',
            method: 'GET'
        };

        function myTimer() {
            var updated = false;

            request(versionRequest, function(error, response, body) {
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'VERSION SERVICE SUCCESSFULLY READ');
                    done();
                } else {
                    loggerTest.info(logContextTest, 'VERSION SERVICE FAILURE READ');
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    },

    verifyStatusService: function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var statusRequest = {
            url: 'http://' + 'localhost' + ':' + properties.get('test-api-port') + '/status',
            method: 'GET'
        };
        function myTimer() {
            var updated = false;

            request(statusRequest, function(error, response, body) {
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'STATUS SERVICE SUCCESSFULLY READ');

                    done();
                } else {
                    loggerTest.info(logContextTest, 'STATUS SERVICE FAILURE READ');
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    },
    verifyConfigService: function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var configRequest = {
            url: 'http://' + 'localhost' + ':' + properties.get('test-api-port') + '/config',
            method: 'GET'
        };
        function myTimer() {
            var updated = false;

            request(configRequest, function(error, response, body) {
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'CONFIG SERVICE SUCCESSFULLY READ');

                    done();
                } else {
                    loggerTest.info(logContextTest, 'CONFIG SERVICE FAILURE READ');
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    },
    verifyCommandsListService: function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var commandsListRequest = {
            url: 'http://' + 'localhost' + ':' + properties.get('test-api-port') + '/commandsList',
            method: 'GET'
        };

        function myTimer() {
            var updated = false;

            request(commandsListRequest, function(error, response, body) {
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'COMMANDS LIST SERVICE SUCCESSFULLY READ');
                    done();
                } else {
                    loggerTest.info(logContextTest, 'COMMANDS LIST SERVICE FAILURE READ');
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    }
};
