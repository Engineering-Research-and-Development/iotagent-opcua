const { test1 } = require('./lib');

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

describe('verify north bound', function() {
    before(
        // async () => {
        // await
        function() {
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

                var PropertiesReader = require('properties-reader');

                loggerTest.info(logContextTest, 'INITIALIZING TESTING ENVIRONMENT...'.rainbow);

                var iotAgentConfig = require('../conf/config.json');
                // var iotAgentProp = require('./config.properties');

                var properties = PropertiesReader(require('path').resolve(__dirname, '../conf/config.properties'));
                global.properties = properties;
                var endpointUrl = properties.get('endpoint');
                var userName = properties.get('userName');
                var password = properties.get('password');

                if (endpointUrl == null) {
                    logger.info(logContext, '/AGE/config-test.properties: endpoint not found...'.red);
                    process.exit(1);
                }

                var doAuto = false;
                var configPath = require('path').resolve(__dirname, '../conf/config.json');
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
                    logger.info(logContext, '----------------    MAPPING TOOL    ----------------');

                    var loadingBar;
                    loadingBar = setInterval(function() {
                        process.stdout.write('.');
                    }, 3000);

                    var exec = require('child_process').exec;
                    try {
                        if (userName != 0 && password != 0) {
                            var cmdjava =
                                'java -jar ../../mapping_tool.jar  -e ' +
                                endpointUrl +
                                ' -f ./config-test.properties' +
                                ' -u ' +
                                userName +
                                ' -p ' +
                                password;
                        } else {
                            var cmdjava =
                                'java -jar ../../mapping_tool.jar  -e ' + endpointUrl + ' -f ./config-test.properties';
                        }
                        var child = exec(cmdjava, function(err, stdout, stderr) {
                            clearInterval(loadingBar);
                            if (err) {
                                logger.error(
                                    logContext,
                                    'There is a problem with automatic configuration. Loading old configuration (if exists)...'
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
                            'There is a problem with automatic configuration. Loading old configuration (if exists)...'
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
        // }
    );

    it('verify get devices', function(done) {
        this.timeout(0);

        // Run test
        var addDeviceRequest = {
            url: 'http://' + properties.get('test-machine-ip') + ':' + properties.get('server-port') + '/iot/devices',
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
});
