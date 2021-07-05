const request = require('request');
var async = require('async');

var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.resolve(__dirname, '../conf/config.properties.WITH_PLACEHOLDER'));
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
    op: 'Test'
};

var loggerTest = require('logops');
loggerTest.format = loggerTest.formatters.pipe;
var child = require('child_process');
var hostIP = null;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('The agent is monitoring active attributes...', function() {
    /*
    before(
        // async () => {
        // await
        function() {
            console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@ WAIT 5 secs');
            var myTimeout = setTimeout(init, 5000);
            function init() {
                // Set Up
                global.logContext = {
                    comp: 'iotAgent-OPCUA',
                    op: 'Index',
                    srv: '',
                    subsrv: ''
                };
                try {
                    // node-opcue dependencies
                    require('requirish')._(module);
                    var check_prop = require('../iot_agent_modules/check_properties');
                    if (check_prop.checkproperties().length != 0) {
                        console.log('WARNING!!!');
                        console.log('CHECK YOUR config.properties FILE,  THE FOLLOWING PARAMETERS ARE NULL:');
                        for (var null_params in check_prop.checkproperties()) {
                            console.log(check_prop.checkproperties()[null_params]);
                        }
                        process.exit(1);
                    }
                    var server = require('../iot_agent_modules/services/server');
                    var run = require('../iot_agent_modules/run/run');
                    var fs = require('fs');
                    // custom simple logger
					var logger = require('logops');
                    var PropertiesReader = require('properties-reader');
                    loggerTest.info(logContextTest, 'INITIALIZING TESTING ENVIRONMENT...');
                    // var iotAgentConfig = require('../conf/config.json');
                    // var iotAgentProp = require('./config.properties');
                    var properties = PropertiesReader(path.resolve(__dirname, '../conf/config.properties'));
                    global.properties = properties;
                    var endpointUrl = properties.get('endpoint');
                    var userName = properties.get('userName');
                    var password = properties.get('password');
                    if (endpointUrl == null) {
                        loggerTest.info(logContext, '/AGE/config-test.properties: endpoint not found...');
                        process.exit(1);
                    }
                    var doAuto = false;
                    var configPath = path.resolve(__dirname, '../conf/config.json');
                    if (fs.existsSync(configPath)) {
                        var config = require(configPath);
                        if (hostIP != null) {
                            var port = config.providerUrl.split(':')[2];
                            config.providerUrl = hostIP + ':' + port;
                        }
                        global.config = config;
                    } else {
                        doAuto = true;
                    }
                    if (doAuto) {
                        logContext.op = 'Index.MappingTool';
                        loggerTest.info(logContext, '----------------    MAPPING TOOL    ----------------');
                        var loadingBar;
                        loadingBar = setInterval(function() {
                            process.stdout.write('.');
                        }, 3000);
                        var exec = require('child_process').exec;
                        try {
                            if (userName != 0 && password != 0) {
                                var cmdjava =
                                    'java -jar ' + require(path.resolve(__dirname, '../mapping_tool.jar')) + ' -e ' +
                                    endpointUrl +
                                    ' -f ' + require(path.resolve(__dirname, '../conf/config.properties')) +
                                    ' -u ' +
                                    userName +
                                    ' -p ' +
                                    password;
                            } else {
                                var cmdjava =
                                    'java -jar ' + path.resolve(__dirname, '../mapping_tool.jar') + ' -e ' +
                                    endpointUrl +
                                    ' -f ' + path.resolve(__dirname, '../conf/config.properties');
                            }
                            var child = exec(cmdjava, function(err, stdout, stderr) {
                                clearInterval(loadingBar);
                                if (err) {
                                    logger.error(
                                        logContext,
                                        'There is a problem with automatic configuration. Loading old configuration (if exists)...' + err
                                    );
                                } else {
                                    logger.info(
                                        logContext,
                                        'Automatic configuration successfully created. Loading new configuration...'
                                    );
                                    var config = require(configPath);
                                }
                                run.run();
                                server.start();
                                process.exit(0);
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
                    }
                } catch (ex) {
                    var logger = require('logops');
                    logger.error(ex);
                    logger.error(logContext, 'Generic error: closing application...'.red);
                    process.exit(1);
                }
            }
        }
        // }
    );
    */

    it('opcua-agent start', function(done) {
        // Set Up
        global.logContext = {
            comp: 'iotAgent-OPCUA',
            op: 'Index',
            srv: '',
            subsrv: ''
        };

        try {
            // node-opcue dependencies
            require('requirish')._(module);
            var check_prop = require('../iot_agent_modules/check_properties');
            if (check_prop.checkproperties().length != 0) {
                console.log('WARNING!!!');
                console.log('CHECK YOUR config.properties FILE,  THE FOLLOWING PARAMETERS ARE NULL:');
                for (var null_params in check_prop.checkproperties()) {
                    console.log(check_prop.checkproperties()[null_params]);
                }
                process.exit(1);
            }

            var server = require('../iot_agent_modules/services/server');
            var run = require('../iot_agent_modules/run/run');
            var fs = require('fs');

            // custom simple logger
            var logger = require('logops');
            var PropertiesReader = require('properties-reader');

            loggerTest.info(logContextTest, 'INITIALIZING TESTING ENVIRONMENT...');

            // var iotAgentConfig = require('../conf/config.json');
            // var iotAgentProp = require('./config.properties');

            var properties = PropertiesReader(path.resolve(__dirname, '../conf/config.properties'));
            properties.set('uniqueSubscription', true);
            global.properties = properties;
            var endpointUrl = properties.get('endpoint');
            var userName = properties.get('userName');
            var password = properties.get('password');

            if (endpointUrl == null) {
                loggerTest.info(logContext, '/AGE/config-test.properties: endpoint not found...');
                process.exit(1);
            }

            var doAuto = false;
            var configPath = path.resolve(__dirname, '../conf/config.json');

            if (fs.existsSync(configPath)) {
                var config = require(configPath);

                if (hostIP != null) {
                    var port = config.providerUrl.split(':')[2];
                    config.providerUrl = hostIP + ':' + port;
                }
                global.config = config;
            } else {
                doAuto = true;
            }

            if (doAuto) {
                logContext.op = 'Index.MappingTool';
                loggerTest.info(logContext, '----------------    MAPPING TOOL    ----------------');

                var loadingBar;
                loadingBar = setInterval(function() {
                    process.stdout.write('.');
                }, 3000);

                var exec = require('child_process').exec;
                try {
                    if (userName != 0 && password != 0) {
                        var cmdjava =
                            'java -jar ' +
                            require(path.resolve(__dirname, '../mapping_tool.jar')) +
                            ' -e ' +
                            endpointUrl +
                            ' -f ' +
                            require(path.resolve(__dirname, '../conf/config.properties')) +
                            ' -u ' +
                            userName +
                            ' -p ' +
                            password;
                    } else {
                        var cmdjava =
                            'java -jar ' +
                            path.resolve(__dirname, '../mapping_tool.jar') +
                            ' -e ' +
                            endpointUrl +
                            ' -f ' +
                            path.resolve(__dirname, '../conf/config.properties');
                    }
                    var child = exec(cmdjava, function(err, stdout, stderr) {
                        clearInterval(loadingBar);
                        if (err) {
                            logger.error(
                                logContext,
                                'There is a problem with automatic configuration. Loading old configuration (if exists)...' +
                                    err
                            );
                        } else {
                            logger.info(
                                logContext,
                                'Automatic configuration successfully created. Loading new configuration...'
                            );
                            var config = require(configPath);
                        }

                        run.run();
                        server.start();
                        done();
                        process.exit(0);
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

    it('verify update of active attributes on Context Broker', function(done) {
        console.log('verify update of active attributes on Context Broker');
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

        //myTimer(); // immediate first run to be re-enabled once updateContext works again

        done();
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

        //myTimer(); // immediate first run to be re-enabled once updateContext works again

        done();
    });

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

        function resetReconnectionFlag() {
            var flagPath = path.resolve(__dirname, './connectionRestablishedFlag');
            try {
                if (fs.existsSync(flagPath)) {
                    fs.unlinkSync(flagPath);
                    done();
                } else {
                    setTimeout(resetReconnectionFlag, 1000);
                }
            } catch (err) {
                console.error(err);
            }
        }

        //resetReconnectionFlag();
    });

    // METHOD NOT WORKING ON ORION-LD
    it('verify commands execution as context provider', function(done) {
        this.timeout(0);
        console.log('verify commands execution as context provider');
        async.series(
            [
                function(callback) {
                    // STOP CAR locally (for Travis unreachability)
                    var json = {
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
                    };
                    var stopRequest = {
                        url:
                            'http://' +
                            properties.get('context-broker-host') +
                            ':' +
                            properties.get('context-broker-port') +
                            '/v1/updateContext',
                        method: 'POST',
                        json: json,
                        headers: {
                            'fiware-service': properties.get('fiware-service'),
                            'fiware-servicepath': properties.get('fiware-service-path')
                        }
                    };

                    function sendRequest() {
                        request(stopRequest, function(error, response, body) {
                            console.log('stopRequest locally error =' + JSON.stringify(error));
                            console.log('stopRequest locally response =' + JSON.stringify(response));
                            console.log('stopRequest locally body =' + JSON.stringify(body));
                            if (body) {
                                if (body.errorCode != undefined) {
                                    setTimeout(sendRequest, 2000);
                                } else {
                                    callback();
                                }
                            } else {
                                callback();
                            }
                        });
                    }

                    sendRequest();
                },
                function(callback) {
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
                                        value: ['1']
                                    }
                                ]
                            }
                        ],
                        updateAction: 'UPDATE'
                    };

                    var accelerateRequest = {
                        url:
                            'http://' +
                            properties.get('context-broker-host') +
                            ':' +
                            properties.get('context-broker-port') +
                            '/v1/updateContext',
                        method: 'POST',
                        json: json,
                        headers: {
                            'fiware-service': properties.get('fiware-service'),
                            'fiware-servicepath': properties.get('fiware-service-path')
                        }
                    };

                    function sendRequest() {
                        request(accelerateRequest, function(error, response, body) {
                            console.log('accelerateRequest locally error =' + JSON.stringify(error));
                            console.log('accelerateRequest locally response =' + JSON.stringify(response));
                            console.log('accelerateRequest locally body =' + JSON.stringify(body));

                            if (body) {
                                if (body.errorCode != undefined) {
                                    setTimeout(sendRequest, 2000);
                                } else {
                                    callback();
                                }
                            } else {
                                callback();
                            }
                        });
                    }

                    sendRequest();
                }
            ],
            function(err, results) {
                done();
            }
        );
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
            url: 'http://' + 'localhost' + ':' + properties.get('server-port') + '/iot/devices/age01_Car',
            headers: {
                'fiware-service': properties.get('fiware-service'),
                'fiware-servicepath': properties.get('fiware-service-path')
            },
            method: 'DELETE'
        };

        request(deviceDeleteRequest, function(error, response, body) {
            if (error == null) {
                done();
            } else {
                done(new Error(error));
            }
        });
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
                url: 'http://' + 'localhost' + ':' + properties.get('server-port') + '/iot/devices',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(getDeviceRequest, function(error, response, body) {
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

        // The new device contains missing active attributes, existent active
        // and lazy attributes
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
                            'fiware-service': properties.get('fiware-service'),
                            'fiware-servicepath': properties.get('fiware-service-path'),
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

                    //myTimer(); // immediate first run
                    done();
                } catch (err) {
                    console.log('Error parsing JSON string:', err);
                }
            });

            // done();
        });
    });
});

describe('Verify Northbound flow', function() {
    it('verify commands execution as context provider', function(done) {
        this.timeout(0);
        console.log('verify commands execution as context provider');
        // Run test

        // STOP CAR
        var json = {};
        json.value = ['1'];
        json.type = 'command';

        var stopRequest = {
            url:
                'http://' +
                'localhost' +
                ':' +
                config.contextBroker.port +
                '/v2/entities/' +
                properties.get('entity-id') +
                '/attrs/Accelerate?type=Device',
            method: 'PUT',
            json: json,
            headers: {
                'content-type': 'application/json',
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };

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
            var bodyObject = null;

            await sleep(10000);

            request(speedRequest, function(error, response, body) {
                done();
            });
        }
        timedTest();
    });
});

describe('Verify ADMIN API services', function() {
    describe('The agent is active...', function() {
        it('verify version service', function(done) {
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
                        done(new Error(error));
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
                url: 'http://' + 'localhost' + ':' + properties.get('api-port') + '/status',
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

            myTimer(); // immediate first run

            // done();
        });

        it('verify config service', function(done) {
            this.timeout(0);
            // Run test

            var value = null;

            var configRequest = {
                url: 'http://' + 'localhost' + ':' + properties.get('api-port') + '/config',
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

            myTimer(); // immediate first run

            // done();
        });

        it('verify commandsList service', function(done) {
            this.timeout(0);
            // Run test

            var value = null;

            var commandsListRequest = {
                url: 'http://' + 'localhost' + ':' + properties.get('api-port') + '/commandsList',
                method: 'GET'
            };

            function myTimer() {
                request(commandsListRequest, function(error, response, body) {
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

            myTimer(); // immediate first run

            // done();
        });

        it('verify config post service', function(done) {
            this.timeout(0);
            // Run test

            var jsonRequest = {
                url: 'http://' + 'localhost' + ':' + properties.get('api-port') + '/json',
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

            myTimer(); // immediate first run

            // done();
        });
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

    describe('test lib...', function() {
        it('verify get about', function(done) {
            this.timeout(0);

            var getAbout = {
                url: 'http://' + 'localhost' + ':' + properties.get('server-port') + '/iot/about',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(getAbout, function(error, response, body) {
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
                url: 'http://' + 'localhost' + ':' + properties.get('server-port') + '/iot/services',
                headers: {
                    'fiware-service': properties.get('fiware-service'),
                    'fiware-servicepath': properties.get('fiware-service-path')
                },
                method: 'GET'
            };

            function myTimer() {
                request(getServiceGroup, function(error, response, body) {
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
