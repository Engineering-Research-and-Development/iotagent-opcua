module.exports = {
    mongoGroup: function(config) {
        global.apikey = '801230BJKL23Y9090DSFL123HJK09H324HV8732';
        console.log('CONFIGURATION API');
        var services = [];
        for (var key in config.types) {
            console.log('Analyzing...' + key);
            var type = config.types[key];

            var service = {
                resource: '/' + key,
                apikey: apikey,
                entity_type: key,
                // trust: '8970A9078A803H3BL98PINEQRW8342HBAMS',
                cbHost: config.contextBroker.host + ':' + config.contextBroker.port,
                commands: type.commands,
                lazy: type.lazy,
                attributes: type.active,
                static_attributes: []
            };
            services.push(service);
        }

        optionsCreation = {
            url: 'http://localhost:' + config.server.port + '/iot/services',
            method: 'POST',
            json: {
                services: services
            },
            headers: {
                'fiware-service': config.service,
                'fiware-servicepath': config.subservice
            }
        };
    }
};
