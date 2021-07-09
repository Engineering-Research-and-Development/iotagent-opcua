const request = require('request');
var async = require('async');

var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.resolve(__dirname, '../conf/config.properties'));
var testProperties = PropertiesReader(path.resolve(__dirname, './test-file-paths.properties'));
var fs = require('fs');

// var config = require(path.resolve(__dirname, '../conf/config.json'));

// Set Up
global.logContextTest = {
    comp: 'iotAgent-OPCUA',
    op: 'Test'
};

var loggerTest = require('logops');
loggerTest.format = loggerTest.formatters.pipe;
var child = require('child_process');
var hostIP = null;

/*
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
*/

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
            properties.set('uniqueSubscription', false);
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

        /*
        // TODO: fix this
        //var childProcess = child.spawn(path.resolve(__dirname, '../tests/print.sh'), {stdio: [process.stdout, "ignore", process.stderr]});
        childProcess.on('exit', function (code) {
            if(code == 0) {
                done();
            } else {
                done(new Error("backoff hunter exit code: ", code));
            }
        });
        */
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
                                        value: [2]
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
                /*
                function(callback) {
                    // Declares test done when the value retrieved from the agent is != null
                    var myVar = null;
                    var value = null;

                    setTimeout(function() {
                        function myTimer() {
                            var updated = false;

                            var json = {
                                entities: [
                                    {
                                        type: 'Device',
                                        isPattern: 'false',
                                        id: 'age01_Car'
                                    }
                                ],
                                attributes: ['Speed']
                            };

                            var speedRequest = {
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


                            request(speedRequest, function(error, response, body) {
                                console.log('speedRequest locally error =' + JSON.stringify(error));
                                console.log('speedRequest locally response =' + JSON.stringify(response));
                                console.log('speedRequest locally body =' + JSON.stringify(body));

                                var bodyObject = {};
                                bodyObject = body;
                                bodyObjectValue = bodyObject.contextResponses[0].contextElement.attributes[0].value;

                                if (value != null) {
                                    if (value != bodyObjectValue) {
                                        value = bodyObjectValue;
                                        var text = 'value updated ' + value;
                                        loggerTest.info(logContextTest, text.rainbow);
                                        updated = true;
                                        clearInterval(myVar);
                                        callback();
                                    }
                                } else {
                                    value = bodyObjectValue;
                                }
                                if (!updated) {
                                    var text = 'value ' + value;
                                    loggerTest.info(logContextTest, text.rainbow);
                                }
                            });

                        }

                        myVar = setInterval(myTimer, 2000);
                    }, 10000);
                }*/
            ],
            function(err, results) {
                done();
            }
        );
    });

    /*
    it('verify reconnection mechanisms (OPC UA side)', function(done) {
        var composeFilePath = path.resolve(__dirname, '../tests/docker-compose.yml');
        var stopCar = 'docker-compose -f ' + composeFilePath + ' stop iotcarsrv';
        child.exec(stopCar, function(err, stdout, stderr) {
            if(err) {
                console.log("An error occurred during carsrv stopping ...");
                console.log(err);
            }

            setTimeout(function() {
                var startCar = 'docker-compose -f ' + composeFilePath + ' up -d iotcarsrv';
                child.exec(startCar, function(err, stdout, stderr) {
                    if(err) {
                        console.log("An error occurred during carsrv starting ...");
                        console.log(err);
                    }

                    done();
                });
            }, 5000);
        });
    });
    */

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
