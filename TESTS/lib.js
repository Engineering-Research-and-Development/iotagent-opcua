module.exports = {
    test1: function(done) {
        const request = require('request');

        var PropertiesReader = require('properties-reader');
        var properties = PropertiesReader(require('path').resolve(__dirname, '../AGECONF/config.testing.properties'));
        var testProperties = PropertiesReader(require('path').resolve(__dirname, './test-file-paths.properties'));
        var fs = require('fs');
        var config = require(require('path').resolve(__dirname, '../AGECONF/config.testing.json'));

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

        this.timeout(0);
        // Run test

        var value = null;

        var versionRequest = {
            url: 'http://' + 'localhost' + ':' + properties.get('api-port') + '/version',
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
                    done(new Error('Failure reading service version'));
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    }
};
