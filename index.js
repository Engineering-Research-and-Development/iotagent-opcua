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
    const mappingTool = require('./mappingTool/mappingTool');
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

    if (fs.existsSync('./conf/config.json')) {
        const config = require('./conf/config.json');
        global.config = config;
        run.run();
        server.start();
    } else {
        logContext.op = 'Index.MappingTool';
        logger.info(logContext, '----------------    MAPPING TOOL    ----------------');
        mappingTool.mappingTool(userName, password, endpointUrl, properties);

        const checkTime = 5000;
        const timerId = setInterval(() => {
            const isExists = fs.existsSync('./conf/config.json', 'utf8');
            if (isExists) {
                const config = require('./conf/config.json');
                global.config = config;
                run.run();
                server.start();
                clearInterval(timerId);
            }
        }, checkTime);
    }
} catch (ex) {
    var logger = require('logops');
    logger.error(ex);
    logger.error(logContext, 'Generic error: closing application...'.red);
    process.exit(1);
}
