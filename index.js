global.logContext = {
    comp: 'iotAgent-OPCUA',
    op: 'Index',
    srv: '',
    subsrv: ''
};

try {
    // node-opcue dependencies
    require('requirish')._(module);
    const check_prop = require('./iot_agent_modules/check_properties');
    if (check_prop.checkproperties().length != 0) {
        console.log('WARNING!!!');
        console.log('CHECK YOUR config.properties FILE,  THE FOLLOWING PARAMETERS ARE NULL:');
        for (const null_params in check_prop.checkproperties()) {
            console.log(check_prop.checkproperties()[null_params]);
        }
        process.exit(1);
    }

    const server = require('./iot_agent_modules/services/server');
    const run = require('./iot_agent_modules/run/run');
    const fs = require('fs');
    // custom simple logger
    var logger = require('logops');
    logger.format = logger.formatters.pipe;

    const PropertiesReader = require('properties-reader');
    const properties = PropertiesReader('./conf/config.properties');
    global.properties = properties;
    const endpointUrl = properties.get('endpoint');
    const userName = properties.get('userName');
    const password = properties.get('password');

    if (endpointUrl == null) {
        logger.info(logContext, '/conf/config.properties: endpoint not found...'.red);
        process.exit(1);
    }

    let doAuto = false;

    if (fs.existsSync('./conf/config.json')) {
        const config = require('./conf/config.json');

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

        const exec = require('child_process').exec;
        try {
            if (userName != 0 && password != 0) {
                var cmdjava =
                    'java -jar mapping_tool.jar  -e ' +
                    endpointUrl +
                    ' -f conf/config.properties' +
                    ' -u ' +
                    userName +
                    ' -p ' +
                    password;
            } else {
                var cmdjava = 'java -jar mapping_tool.jar  -e ' + endpointUrl + ' -f conf/config.properties';
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
                    const config = require('./conf/config.json');
                    global.config = config;
                }

                run.run();
                server.start();
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
