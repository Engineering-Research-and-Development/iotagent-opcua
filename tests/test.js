const request = require('request');
var async = require('async');

var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.resolve(__dirname, '../conf/config.properties'));
var testProperties = PropertiesReader(path.resolve(__dirname, './test-file-paths.properties'));
var fs = require('fs');
var fT = require('../iot_agent_modules/run/findType');
var mG = require('../iot_agent_modules/run/mongoGroup');
var rSfN = require('../iot_agent_modules/run/removeSuffixFromName');
var cR = require('../iot_agent_modules/run/createResponse');
var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../conf/config.json'), 'utf8'));

// Set Up
global.logContextTest = {
    comp: 'iotAgent-OPCUA',
    op: 'Test',
    srv: '',
    subsrv: ''
};

var loggerTest = require('logops');
loggerTest.format = loggerTest.formatters.pipe;
var child = require('child_process');
var hostIP = null;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('The agent is monitoring active attributes...', function() {
    it('opcua-agent start', function(done) {
        // Set Up
        global.logContext = {
            comp: 'iotAgent-OPCUA',
            op: 'Test',
            srv: '',
            subsrv: ''
        };

        try {
            // node-opcue dependencies
            require('requirish')._(module);
            const check_prop = require('../iot_agent_modules/check_properties');
            if (check_prop.checkproperties().length != 0) {
                console.log('WARNING!!!');
                console.log('CHECK YOUR config.properties FILE,  THE FOLLOWING PARAMETERS ARE NULL:');
                for (const null_params in check_prop.checkproperties()) {
                    console.log(check_prop.checkproperties()[null_params]);
                }
                process.exit(1);
            }

            const server = require('../iot_agent_modules/services/server');
            const run = require('../iot_agent_modules/run/run');
            const fs = require('fs');
            // custom simple logger
            var logger = require('logops');
            logger.format = logger.formatters.pipe;

            const PropertiesReader = require('properties-reader');
            const properties = PropertiesReader(path.resolve(__dirname, '../conf/config.properties'));
            global.properties = properties;
            const endpointUrl = properties.get('endpoint');
            const userName = properties.get('userName');
            const password = properties.get('password');

            if (endpointUrl == null) {
                logger.info(logContext, '../conf/config.properties: endpoint not found...'.red);
                process.exit(1);
            }

            let doAuto = false;

            if (fs.existsSync(path.resolve(__dirname, '../conf/config.json'))) {
                const config = require(path.resolve(__dirname, '../conf/config.json'));

                global.config = config;
            } else {
                doAuto = true;
            }

            if (doAuto) {
                logContext.op = 'Index.MappingTool';
                logger.info(logContext, '----------------    MAPPING TOOL    ----------------');

                let loadingBar;
                loadingBar = setInterval(function() {
                    process.stdout.write('.');
                }, 3000);

                const spawn = require('child_process').spawn;
                var args = [];
                try {
                    if (userName != 0 && password != 0) {
                        args = [
                            '-jar',
                            'mapping_tool.jar',
                            '-e',
                            endpointUrl,
                            '-f',
                            path.resolve(__dirname, '../conf/config.properties'),
                            '-u',
                            userName,
                            '-p',
                            password
                        ];
                    } else {
                        args = [
                            '-jar',
                            'mapping_tool.jar',
                            '-e',
                            endpointUrl,
                            '-f',
                            path.resolve(__dirname, '../conf/config.properties')
                        ];
                    }

                    var child = spawn('java', args);

                    child.stdout.on('data', function(data) {
                        console.log('[MAPPING TOOL]: ' + data);
                    });

                    child.on('exit', function(code) {
                        console.log('child process exited with code ' + code);
                        if (code != 0) {
                            logger.error(
                                logContext,
                                'There is a problem with automatic configuration. Loading old configuration (if exists)...' +
                                    code
                            );
                        } else {
                            logger.info(
                                logContext,
                                'Automatic configuration successfully created. Loading new configuration...'
                            );
                            const config = require(path.resolve(__dirname, '../conf/config.json'));
                            global.config = config;

                            run.run();
                            server.start();
                        }
                    });
                } catch (ex) {
                    clearInterval(loadingBar);
                    logger.info(
                        logContext,
                        'There is a problem with automatic configuration. Loading old configuration (if exists)...' + ex
                    );
                }
                module.exports = child;
            } else {
                run.run();
                server.start();
                done();
            }
        } catch (ex) {
            var logger = require('logops');
            logger.error(ex);
            logger.error(logContext, 'Generic error: closing application...');
            process.exit(1);
        }
    });
});

describe('Test Iot Agent lib', function() {
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

    describe('get temp ', function() {
        it('verify get temp', function(done) {
            this.timeout(0);
            // Run test
            var value = null;
            var temperatureRequest = {
                url:
                    'http://' +
                    properties.get('context-broker-host') +
                    ':' +
                    properties.get('context-broker-port') +
                    '/v2/entities/' +
                    properties.get('entity-id') +
                    '/attrs/Engine_Temperature',
                method: 'GET',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                }
            };

            function myTimer() {
                var updated = false;
                request(temperatureRequest, function(error, response, body) {
                    console.log('temperatureRequest');
                    if (error) {
                        console.log('An error occurred during temperature request send');
                        console.log(error);
                    }

                    var bodyObject = {};
                    bodyObject = JSON.parse(body);

                    console.log(typeof bodyObject);

                    if (value != null) {
                        if (bodyObject.value != 0) {
                            value = bodyObject.value;
                            var text = 'value updated ' + value;
                            loggerTest.info(logContextTest, text);
                            updated = true;
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
            myTimer();
            done();
        });
    });

    describe('test lib...', function() {
        it('verify get about', function(done) {
            this.timeout(0);

            var getAbout = {
                url:
                    'http://' +
                    properties.get('context-broker-host') +
                    ':' +
                    properties.get('server-port') +
                    '/iot/about',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(getAbout, function(error, response, body) {
                    console.log('getAbout');
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

            myTimer();
        });
    });

    describe('Test service group API', function() {
        it('verify get services', function(done) {
            this.timeout(0);

            // Run test
            var getServiceGroup = {
                url:
                    'http://' +
                    properties.get('context-broker-host') +
                    ':' +
                    properties.get('server-port') +
                    '/iot/services',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(getServiceGroup, function(error, response, body) {
                    console.log('getServiceGroup');
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

            myTimer();
        });
    });

    it('verify commands execution as context provider', function(done) {
        this.timeout(0);

        var commandsRequest = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('context-broker-port') +
                '/v1/updateContext',
            method: 'POST',
            json: {
                contextElements: [
                    {
                        type: 'Device',
                        isPattern: 'false',
                        id: 'age01_Car',
                        attributes: [
                            {
                                name: 'Stop',
                                type: 'command',
                                value: null
                            }
                        ]
                    }
                ],
                updateAction: 'UPDATE'
            },

            headers: {
                'content-type': 'application/json',
                'fiware-service': properties.get('fiware-service'),
                'fiware-servicepath': properties.get('fiware-service-path')
            }
        };
        function myTimer() {
            request.post(commandsRequest, function(error, response, body) {
                console.log('commandsRequest');
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));
                if (error == null) {
                    loggerTest.info(logContextTest, 'commandsRequest SUCCESSFULLY POSTED');
                    done();
                } else {
                    loggerTest.info(logContextTest, 'commandsRequest FAILURE POSTED');
                    done(new Error(error));
                }
            });
        }

        myTimer();
    });

    it('verify accelerateRequest as context provider', function(done) {
        this.timeout(0);

        var accelerateRequest = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('context-broker-port') +
                '/v1/updateContext',
            method: 'POST',
            json: {
                contextElements: [
                    {
                        type: 'Device',
                        isPattern: 'false',
                        id: 'age01_Car',
                        attributes: [
                            {
                                name: 'Accelerate',
                                type: 'command',
                                value: ['1']
                            }
                        ]
                    }
                ],
                updateAction: 'UPDATE'
            },
            headers: {
                'content-type': 'application/json',
                'fiware-service': properties.get('fiware-service'),
                'fiware-servicepath': properties.get('fiware-service-path')
            }
        };
        function myTimer() {
            request.post(accelerateRequest, function(error, response, body) {
                console.log('accelerateRequest');
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));
                if (error == null) {
                    loggerTest.info(logContextTest, 'accelerateRequest SUCCESSFULLY POSTED');
                    done();
                } else {
                    loggerTest.info(logContextTest, 'accelerateRequest FAILURE POSTED');
                    done(new Error(error));
                }
            });
        }

        myTimer();
    });

    it('verify get of lazy attributes on Context Broker', function(done) {
        console.log('verify update of active attributes on Context Broker');
        this.timeout(0);
        // Run test
        var value = null;
        var speedRequest = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('context-broker-port') +
                '/v2/entities/' +
                properties.get('entity-id') +
                '/attrs/Speed',
            method: 'GET',
            headers: {
                'fiware-service': properties.get('fiware-service'),
                'fiware-servicepath': properties.get('fiware-service-path')
            }
        };

        function myTimer() {
            var updated = false;
            request(speedRequest, function(error, response, body) {
                console.log('speedRequest');
                if (error) {
                    console.log('An error occurred during speed request send');
                    console.log(error);
                }

                var bodyObject = {};
                bodyObject = JSON.parse(body);

                console.log(typeof bodyObject);

                if (value != null) {
                    if (bodyObject.value != 0) {
                        value = bodyObject.value;
                        var text = 'value updated ' + value;

                        loggerTest.info(logContextTest, text);
                        updated = true;

                        //done();
                    }
                } else {
                    value = bodyObject.value;
                    //done();
                }

                if (!updated) {
                    var text = 'value ' + value;
                    loggerTest.info(logContextTest, text);
                    //setTimeout(myTimer, 2000);
                }
            });
        }

        //myTimer(); // immediate first run to be re-enabled once updateContext works again

        done();
    });
});

describe('Add Device', function() {
    it('verify the addition of a new device', function(done) {
        this.timeout(0);
        // Run test
        var addDeviceRequest = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('server-port') +
                '/iot/devices',
            headers: {
                'fiware-service': properties.get('fiware-service'),
                'fiware-servicepath': properties.get('fiware-service-path'),
                'content-type': 'application/json'
            },
            method: 'POST',
            json: {
                devices: [
                    {
                        device_id: 'age05_Car',
                        entity_name: 'age05_Car',
                        entity_type: 'Device',
                        attributes: [
                            { object_id: 'ns=3;s=EngineBrake', name: 'EngineBrake', type: 'Number' },
                            { object_id: 'ns=3;s=Acceleration', name: 'Acceleration', type: 'Number' },
                            { object_id: 'ns=3;s=EngineStopped', name: 'EngineStopped', type: 'Boolean' },
                            { object_id: 'ns=3;s=Temperature', name: 'Temperature', type: 'Number' },
                            { object_id: 'ns=3;s=Oxigen', name: 'Oxigen', type: 'Number' }
                        ],
                        lazy: [{ object_id: 'ns=3;s=Speed', name: 'Speed', type: 'Number' }],
                        commands: []
                    }
                ]
            }
        };

        function myTimer() {
            request.post(addDeviceRequest, function(error, response, body) {
                console.log('addDeviceRequest');
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'REST - ADD DEVICE SUCCESS');

                    done();
                } else {
                    loggerTest.info(logContextTest, 'REST - ADD DEVICE FAILURE');
                    done();
                }
            });
        }
        myTimer();
    });
});

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
            var getDeviceRequest = {
                url:
                    'http://' +
                    properties.get('context-broker-host') +
                    ':' +
                    properties.get('server-port') +
                    '/iot/devices',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(getDeviceRequest, function(error, response, body) {
                    console.log('getDeviceRequest');
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
            myTimer();
        });
    });
});

describe('Verify Northbound flow', function() {
    it('verify commands execution as context provider', function(done) {
        this.timeout(0);
        // Run test

        var accelerateCar = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('context-broker-port') +
                '/v2/entities/' +
                properties.get('entity-id') +
                '/attrs/Accelerate?type=Device',
            method: 'PUT',
            json: {
                value: ['1'],
                type: 'command'
            },
            headers: {
                'content-type': 'application/json',
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };

        function myTimer() {
            request.put(accelerateCar, function(error, response, body) {
                console.log('accelerateRequest');
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'REST - accelerateCar command');

                    done();
                } else {
                    loggerTest.info(logContextTest, 'REST - accelerateCar command');
                    done(new Error('REST - accelerateCar command'));
                }
            });
        }
        myTimer();
    });

    it('verify speed', function(done) {
        this.timeout(0);
        var speedRequest2 = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('context-broker-port') +
                '/v2/entities/' +
                properties.get('entity-id') +
                '/attrs/Speed',
            method: 'GET',
            headers: {
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };

        function myTimer() {
            request.get(speedRequest2, function(error, response, body) {
                console.log('speedRequest');
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'REST - speed check');

                    done();
                } else {
                    loggerTest.info(logContextTest, 'REST - speed check');
                    done(new Error('REST - speed check'));
                }
            });
        }
        myTimer();
    });
});

describe('Verify ADMIN API services', function() {
    it('verify version service', function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var versionRequest = {
            url: 'http://' + properties.get('context-broker-host') + ':' + properties.get('api-port') + '/version',
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
                    done(new Error(error));
                }
            });
        }
        myTimer();
    });

    it('verify status service', function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var statusRequest = {
            url: 'http://' + properties.get('context-broker-host') + ':' + properties.get('api-port') + '/status',
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
                    done(new Error(error));
                }
            });
        }
        myTimer();
    });

    it('verify config service', function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var configRequest = {
            url: 'http://' + properties.get('context-broker-host') + ':' + properties.get('api-port') + '/config',
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
                    done(new Error(error));
                }
            });
        }
        myTimer();
    });

    it('verify commandsList service', function(done) {
        this.timeout(0);
        // Run test

        var value = null;

        var commandsListRequest = {
            url: 'http://' + properties.get('context-broker-host') + ':' + properties.get('api-port') + '/commandsList',
            method: 'GET'
        };

        function myTimer() {
            request(commandsListRequest, function(error, response, body) {
                console.log('commandsListRequest');
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));

                if (error == null) {
                    loggerTest.info(logContextTest, 'COMMANDS LIST SERVICE SUCCESSFULLY READ');
                    done();
                } else {
                    loggerTest.info(logContextTest, 'COMMANDS LIST SERVICE FAILURE READ');
                    done(new Error(error));
                }
            });
        }
        myTimer();
    });

    it('verify config post service', function(done) {
        this.timeout(0);

        var jsonRequest = {
            url: 'http://' + properties.get('context-broker-host') + ':' + properties.get('api-port') + '/json',
            method: 'POST',
            json: true,
            body: config
        };
        function myTimer() {
            request(jsonRequest, function(error, response, body) {
                loggerTest.info(logContextTest, 'RESPONSE=' + JSON.stringify(response));
                if (error == null) {
                    loggerTest.info(logContextTest, 'CONFIG JSON SERVICE SUCCESSFULLY POSTED');
                    done();
                } else {
                    loggerTest.info(logContextTest, 'CONFIG JSON SERVICE FAILURE POSTED');
                    done(new Error(error));
                }
            });
        }
        myTimer();
    });
});

describe('Test findType module', function() {
    it('verify functionalities of findType module', function(done) {
        if (fT.findType('Engine_Temperature', config.types.Device).toString() == 'Number') {
            done();
        } else {
            done(new Error('missing type'));
        }
    });

    it('verify functionalities of findType module (undefined device)', function(done) {
        if (fT.findType('Engine_Temperature', undefined) == null) {
            done();
        } else {
            done(new Error('wrong behaviour for undefined device'));
        }
    });
});

describe('Build mongoGroup module', function() {
    it('builg group', function(done) {
        mG.mongoGroup(config);
        done();
    });
});

describe('test removeSuffixFromName module', function() {
    it('removing SuffixFromName', function(done) {
        if (rSfN.removeSuffixFromName('testR', 'R').toString() == 'test') {
            done();
        } else {
            done(new Error('removing SuffixFromName failed'));
        }
    });

    it('no SuffixFromName', function(done) {
        if (rSfN.removeSuffixFromName('test', 'B').toString() == 'test') {
            done();
        } else {
            done(new Error('removing SuffixFromName failed'));
        }
    });
});

describe('Test createResponde module', function() {
    it('creating response', function(done) {
        if (cR.createResponse('test', 'string', config.types.Device.active, '1,2,3,4,5', [1, 2, 3, 4, 5]) != null) {
            done();
        } else {
            done(new Error('creating response failed'));
        }
    });
});

describe('stop and start car server + delete device', function() {
    it('stop car srv', function(done) {
        setTimeout(function() {
            child.exec(path.resolve(__dirname, './stop_carsrv.sh'), function(err, stdout, stderr) {
                if (err) {
                    console.log('An error occurred during car server stop ...');
                    console.log(err);
                }
                console.log('car stop script log');
                console.log('STDOUT: ');
                console.log(stdout);
                console.log('STDERR: ');
                console.log(stderr);
                done();
            });
        }, 5000);
    });

    it('start car srv', function(done) {
        setTimeout(function() {
            child.exec(path.resolve(__dirname, './start_carsrv.sh'), function(err, stdout, stderr) {
                if (err) {
                    console.log('An error occurred during car server restart ...');
                    console.log(err);
                }
                console.log('car start script log');
                console.log('STDOUT: ');
                console.log(stdout);
                console.log('STDERR: ');
                console.log(stderr);
                done();
            });
        }, 5000);
    });

    it('verify reconnection mechanisms (OPC UA side)', function(done) {
        var composeFilePath = path.resolve(__dirname, '../tests/docker-compose.yml');
        var stopCar = 'docker-compose -f ' + composeFilePath + ' stop iotcarsrv';
        child.exec(stopCar, function(err, stdout, stderr) {
            if (err) {
                console.log('An error occurred during carsrv stopping ...');
                console.log(err);
            }

            setTimeout(function() {
                var startCar = 'docker-compose -f ' + composeFilePath + ' up -d iotcarsrv';
                child.exec(startCar, function(err, stdout, stderr) {
                    if (err) {
                        console.log('An error occurred during carsrv starting ...');
                        console.log(err);
                    }

                    done();
                });
            }, 5000);
        });
    });

    it('delete device', function(done) {
        // Delete device
        // TODO: parametrize age01_Car in the whole test.js file.

        var deviceDeleteRequest = {
            url:
                'http://' +
                properties.get('context-broker-host') +
                ':' +
                properties.get('server-port') +
                '/iot/devices/age01_Car',
            headers: {
                'fiware-service': properties.get('fiware-service'),
                'fiware-servicepath': properties.get('fiware-service-path')
            },
            method: 'DELETE'
        };

        request(deviceDeleteRequest, function(error, response, body) {
            console.log('deviceDeleteRequest');
            if (error == null) {
                done();
            } else {
                done(new Error(error));
            }
        });
    });
});
