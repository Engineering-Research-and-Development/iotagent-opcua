/*
 * Copyright 2019 -  Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opc-ua
 *
 */

const request = require('request');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(require('path').resolve(__dirname, '../AGECONF/config.properties'));
var testProperties = PropertiesReader(require('path').resolve(__dirname, './test-file-paths.properties'));
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        it('verify get devices', function(done) {
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
                        loggerTest.info(logContextTest, 'REST - GET DEVICES SUCCESS');
                        done();
                    } else {
                        loggerTest.info(logContextTest, 'REST - GET DEVICES FAILURE');
                        done(new Error('REST - GET DEVICES FAILURE'));
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
                                loggerTest.info(logContextTest, 'REST - ADD DEVICE SUCCESS');

                                done();
                            } else {
                                loggerTest.info(logContextTest, 'REST - ADD DEVICE FAILURE');
                                done(new Error('REST - ADD DEVICE FAILURE'));
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
                'localhost' +
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

                        loggerTest.info(logContextTest, text);
                        updated = true;

                        done();
                    }
                } else {
                    value = bodyObject.value;
                }

                if (!updated) {
                    var text = 'value ' + value;
                    loggerTest.info(logContextTest, text);
                    setTimeout(myTimer, 2000);
                }
            });
        }

        myTimer(); // immediate first run

        // done();
    });

    it('verify commands execution as context provider', function(done) {
        this.timeout(0);
        console.log('verify commands execution as context provider');
        // Run test

        // STOP CAR
        var json = {};
        json.value = null;
        json.type = 'command';

        var stopRequest = {
            url:
                'http://' +
                'localhost' +
                ':' +
                config.contextBroker.port +
                '/v2/entities/' +
                properties.get('entity-id') +
                '/attrs/Stop?type=Device',
            method: 'PUT',
            json: json,
            headers: {
                'content-type': 'application/json',
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };

        // Initially the car engine is off. Stop commands turn the engine on
        // after that the oxygen must be greater than 0
        request(stopRequest, function(error, response, body) {
            console.log('stopRequest error STOP=' + JSON.stringify(error));
            console.log('stopRequest response STOP=' + JSON.stringify(response));
            console.log('stopRequest body STOP=' + JSON.stringify(body));

            var oxygenRequest = {
                url:
                    'http://' +
                    'localhost' +
                    ':' +
                    config.contextBroker.port +
                    '/v2/entities/' +
                    properties.get('entity-id') +
                    '/attrs/Oxigen',
                method: 'GET',
                headers: {
                    'fiware-service': config.service,
                    'fiware-servicepath': config.subservice
                }
            };

            /*
				async function timedTest() {
					var bodyObject = null;
					const N_OF_TRIES = 20;
					var i = 0;
					for( ; i < N_OF_TRIES ; ++i) {
						request(oxygenRequest, function(error, response, body) {
							bodyObject = JSON.parse(body);
							
							if(bodyObject != null) {
								if(bodyObject.value > 0) {
									console.log("Success after " + i + " tries");
									i = N_OF_TRIES;
								}
							}
						});
						await sleep(2000);
					}
					
					if(bodyObject != null) {
						if(bodyObject.value <= 0) {
							done(new Error("Oxygen is NOT greater than 0"));
						}
					} 
				}*/

            async function timedTest() {
                var bodyObject = null;

                await sleep(10000);

                request(oxygenRequest, function(error, response, body) {
                    bodyObject = JSON.parse(body);

                    if (bodyObject != null) {
                        if (bodyObject.value > 0) {
                            console.log('Oxygen is OK');
                            done();
                        } else {
                            done(new Error('Oxygen is not greater than zero'));
                        }
                    } else {
                        done(new Error('Oxygen request null body'));
                    }
                });
            }

            timedTest();
        });

        // Accelerate CAR locally (for Travis unreachability)
        var json = {
            contextElements: [
                {
                    type: 'Device',
                    isPattern: 'false',
                    id: 'age01_Car',
                    attributes: [
                        {
                            name: 'Accelerate',
                            type: 'command',
                            value: [2]
                        }
                    ]
                }
            ],
            updateAction: 'UPDATE'
        };

        var accelerateRequest = {
            url: 'http://localhost' + ':' + config.contextBroker.port + '/v1/updateContext',
            method: 'POST',
            json: json,
            headers: {
                'content-type': 'application/json',
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };

        request(accelerateRequest, function(error, response, body) {
            console.log('accelerateRequest locally error =' + JSON.stringify(error));
            console.log('accelerateRequest locally response =' + JSON.stringify(response));
            console.log('accelerateRequest locally body =' + JSON.stringify(body));

            var bodyObject = body;
            if (bodyObject != null) {
                if (bodyObject.contextResponses[0].statusCode.code != 200) {
                    console.log(body);
                    done(new Error('Accelerate request status code <> 200'));
                }
            } else {
                done(new Error('Accelerate request returned no body'));
            }
        });

        var value = null;

        function myTimer() {
            var updated = false;

            var speedRequest = {
                url:
                    'http://' +
                    'localhost' +
                    ':' +
                    config.contextBroker.port +
                    '/v2/entities/' +
                    properties.get('entity-id') +
                    '/attrs/Speed',
                method: 'GET',
                headers: {
                    'fiware-service': config.service,
                    'fiware-servicepath': config.subservice
                }
            };

            async function timedTest() {
                const N_OF_SAMPLES = 5;
                var i = 0;
                for (; i < N_OF_SAMPLES; ++i) {
                    request(speedRequest, function(error, response, body) {
                        var bodyObject = JSON.parse(body);

                        if (bodyObject != null) {
                            if (bodyObject.value > 0) {
                                done();
                            }
                        } else {
                            done(new Error('Error during acceleration request'));
                        }
                    });

                    await sleep(1000);
                }
            }

            timedTest();
        }
        myTimer();
    });
});

describe('Verify ADMIN API services', function() {
    describe('The agent is active...', function() {
        it('verify version service', function(done) {
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
        });

        it('verify status service', function(done) {
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
        });

        it('verify config service', function(done) {
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
        });

        it('verify commandsList service', function(done) {
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
        });

        /*
        it('verify config post service', function(done) {
            this.timeout(0);
            // Run test

            var value = null;
            var iotAgentConfig = require('./../../conf/config.json');

            var jsonRequest = {
                url: 'http://' + 'localhost' + ':' + properties.get('test-api-port') + '/json',
                method: 'POST',
                json: true,
                body: config
            };
            function myTimer() {
                var updated = false;

                request(jsonRequest, function(error, response, body) {
                    loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));
                    if (error == null) {
                        loggerTest.info(logContextTest, 'CONFIG JSON SERVICE SUCCESSFULLY POSTED');

                        done();
                    } else {
                        loggerTest.info(logContextTest, 'CONFIG JSON SERVICE FAILURE POSTED');
                    }
                });
            }

            myTimer(); // immediate first run

            // done();
        });
        */
    });
});
