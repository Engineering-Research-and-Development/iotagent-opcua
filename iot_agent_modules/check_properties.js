module.exports = {
    checkproperties: function() {
        var PropertiesReader = require('properties-reader');
        var properties = PropertiesReader('./conf/config.properties');
        // fully qualified name
        var context_broker_host = properties.get('context-broker-host');
        var context_broker_port = properties.get('context-broker-port');
        var server_base_root = properties.get('server-base-root');
        var server_port = properties.get('server-port');
        var device_registry_type = properties.get('device-registry-type');
        var mongodb_host = properties.get('mongodb-host');
        var mongodb_port = properties.get('mongodb-port');
        var mongodb_db = properties.get('mongodb-db');
        var mongodb_retries = properties.get('mongodb-retries');
        var mongodb_retry_time = properties.get('mongodb-retry-time');
        var fiware_service = properties.get('fiware-service');
        var fiware_service_path = properties.get('fiware-service-path');
        var device_registration_duration = properties.get('device-registration-duration');
        var endpoint = properties.get('endpoint');
        var log_level = properties.get('log-level');
        var requestedPublishingInterval = properties.get('requestedPublishingInterval');
        var requestedLifetimeCount = properties.get('requestedLifetimeCount');
        var requestedMaxKeepAliveCount = properties.get('requestedMaxKeepAliveCount');
        var maxNotificationsPerPublish = properties.get('maxNotificationsPerPublish');
        var publishingEnabled = properties.get('publishingEnabled');
        var priority = properties.get('priority');
        var api_port = properties.get('api-port');
        var polling = properties.get('polling');
        var polling_commands_timer = properties.get('polling-commands-timer');
        var pollingDaemonFrequency = properties.get('pollingDaemonFrequency');
        var pollingExpiration = properties.get('pollingExpiration');

        var samplingInterval = properties.get('samplingInterval');
        var queueSize = properties.get('queueSize');
        var discardOldest = properties.get('discardOldest');

        var check = {
            context_broker_host: context_broker_host,
            context_broker_port: context_broker_port,
            server_base_root: server_base_root,
            server_port: server_port,
            device_registry_type: device_registry_type,
            mongodb_host: pollingExpiration,
            mongodb_port: mongodb_port,
            mongodb_db: mongodb_db,
            mongodb_retries: mongodb_retries,
            mongodb_retry_time: mongodb_retry_time,
            fiware_service: fiware_service,
            fiware_service_path: fiware_service_path,
            device_registration_duration: device_registration_duration,
            log_level: log_level,
            endpoint: endpoint,
            requestedPublishingInterval: requestedPublishingInterval,
            requestedLifetimeCount: requestedLifetimeCount,
            requestedMaxKeepAliveCount: requestedMaxKeepAliveCount,
            maxNotificationsPerPublish: maxNotificationsPerPublish,
            publishingEnabled: publishingEnabled,
            priority: priority,
            api_port: api_port,
            polling_commands_timer: polling_commands_timer,
            pollingDaemonFrequency: pollingDaemonFrequency,
            pollingExpiration: pollingExpiration,
            samplingInterval: samplingInterval,
            queueSize: queueSize,
            discardOldest: discardOldest
        };
        var null_prop = [];
        for (var key in check) {
            if (check[key] == null || check[key] == '') if (check[key] != 0) null_prop.push(key);
        }

        if (polling == true || polling == false) {
        } else {
            null_prop.push('polling');
        }

        return null_prop;
    }
};
