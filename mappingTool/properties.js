module.exports = {
    properties: async function(properties, configJson) {
        configJson['logLevel'] = properties.get('log-level');
        configJson['multiCore'] = false;
        configJson['relaxTemplateValidation'] = true;
        configJson['contextBroker'] = {
            host: properties.get('context-broker-host'),
            port: properties.get('context-broker-port'),
            service: properties.get('fiware-service'),
            subservice: properties.get('fiware-service-path')
        };

        configJson['server'] = {
            port: properties.get('server-port'),
            baseRoot: properties.get('server-base-root')
        };

        configJson['deviceRegistry'] = {
            type: properties.get('device-registry-type')
        };

        configJson['mongodb'] = {
            host: properties.get('mongodb-host'),
            port: properties.get('mongodb-port').toString(),
            db: properties.get('mongodb-db'),
            retries: properties.get('mongodb-retries'),
            retryTime: properties.get('mongodb-retry-time')
        };
        configJson['types'] = {};
        configJson['browseServerOptions'] = null;
        configJson['service'] = properties.get('fiware-service');
        configJson['subservice'] = properties.get('fiware-service-path');
        configJson['providerUrl'] = properties.get('provider-url');
        configJson['pollingExpiration'] = properties.get('pollingExpiration').toString();
        configJson['pollingDaemonFrequency'] = properties.get('pollingDaemonFrequency').toString();
        configJson['deviceRegistrationDuration'] = properties.get('device-registration-duration');
        configJson['defaultType'] = null;
        configJson['contexts'] = [];
        configJson['contextSubscriptions'] = [];

        return configJson;
    }
};
