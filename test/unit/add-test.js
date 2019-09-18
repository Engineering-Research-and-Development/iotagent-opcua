/*
 * Copyright 2019 -  Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opc-ua
 *
 */

const request = require('request');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(require('path').resolve(__dirname, '../../AGECONF/config.properties'));
var testProperties = PropertiesReader(require('path').resolve(__dirname, './test-file-paths.properties'));
var fs = require('fs');
var config = require(require('path').resolve(__dirname, '../../AGECONF/config.json'));

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

describe('Verify REST Devices Management', function() {
    beforeEach(function(done) {
        // Set up
        done();
    });

    afterEach(function(done) {
        // Clean Up
        done();
    });
    after(function(done) {
        // Clean Up
        done();
    });

    describe('The agent is active...', function() {
        it('verify devices retrieval', function(done) {
            this.timeout(0);

            // Run test
            var addDeviceRequest = {
                url: 'http://' + 'localhost' + ':' + properties.get('server-port') + '/iot/devices',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(addDeviceRequest, function(error, response, body) {
                    loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                    if (error == null) {
                        loggerTest.info(logContextTest, 'DEVICES RETRIEVAL SERVICE SUCCESS');
                        done();
                    } else {
                        loggerTest.info(logContextTest, 'DEVICES RETRIEVAL SERVICE FAILURE');
                    }
                });
            }

            myTimer(); // immediate first run

            // done();
        });

        it('verify the addition of a new device', function(done) {
            this.timeout(0);
            // Run test

            fs.readFile(testProperties.get('add-device-1'), 'utf8', (err, jsonString) => {
                if (err) {
                    console.log('Error reading file from disk:', err);
                    return;
                }

                try {
                    const device = JSON.parse(jsonString);

                    var addDeviceRequest = {
                        url: 'http://' + 'localhost' + ':' + properties.get('server-port') + '/iot/devices',
                        headers: {
                            'fiware-service': config.service,
                            'fiware-servicepath': config.subservice,
                            'content-type': 'application/json'
                        },
                        method: 'POST',
                        json: device
                    };

                    function myTimer() {
                        request.post(addDeviceRequest, function(error, response, body) {
                            loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                            if (error == null) {
                                loggerTest.info(logContextTest, 'ADD DEVICE SERVICE SUCCESSFULLY READ');
                                done();
                            } else {
                                loggerTest.info(logContextTest, 'ADD DEVICE SERVICE FAILURE READ');
                            }
                        });
                    }

                    myTimer(); // immediate first run
                } catch (err) {
                    console.log('Error parsing JSON string:', err);
                }
            });

            // done();
        });
    });
});

describe('Verify Northbound flow', function() {
    // TODO: This works only if the temperature attr is available
    it('verify update of active attributes on Context Broker', function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var temperatureRequest = {
            url:
                'http://' +
                config.contextBroker.host +
                ':' +
                config.contextBroker.port +
                '/v2/entities/' +
                properties.get('entity-id') +
                '/attrs/Temperature',
            method: 'GET',
            headers: {
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };
        function myTimer() {
            var updated = false;

            request(temperatureRequest, function(error, response, body) {
                var bodyObject = {};
                bodyObject = JSON.parse(body);
                if (value != null) {
                    if (value != bodyObject.value) {
                        value = bodyObject.value;
                        var text = 'value updated ' + value;

                        loggerTest.info(logContextTest, text.rainbow);
                        updated = true;

                        done();
                    }
                } else {
                    value = bodyObject.value;
                }

                if (!updated) {
                    var text = 'value ' + value;
                    loggerTest.info(logContextTest, text.rainbow);
                    setTimeout(myTimer, 2000);
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    });
});
