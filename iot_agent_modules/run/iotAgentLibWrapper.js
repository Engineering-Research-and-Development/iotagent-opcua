var iotAgentLib = require('iotagent-node-lib');
var logger = require('logops');
logger.format = logger.formatters.pipe;

// iotagent-node-lib dependencies
var groupService = require('../../node_modules/iotagent-node-lib/lib/services/groups/groupService');
var commonConfig = require('../../node_modules/iotagent-node-lib/lib/commonConfig');
var deviceService = require('../../node_modules/iotagent-node-lib/lib/services/devices/deviceService');
var alarms = require('../../node_modules/iotagent-node-lib/lib/services/common/alarmManagement');
var commands = require('../../node_modules/iotagent-node-lib/lib/services/commands/commandService');
var constants = require('../../node_modules/iotagent-node-lib/lib/constants');

var not_found_context = 0;

module.exports = {
    setDataQueryHandler: function(queryContextHandler) {
        iotAgentLib.setDataQueryHandler(queryContextHandler);
    },

    setCommandHandler: function(commandContextHandler) {
        iotAgentLib.setCommandHandler(commandContextHandler);
    },

    setProvisioningHandler: function(provisioningHandler) {
        iotAgentLib.setProvisioningHandler(provisioningHandler);
    },

    setRemoveDeviceHandler: function(removeDeviceHandler) {
        iotAgentLib.setRemoveDeviceHandler(removeDeviceHandler);
    },

    activate: function(config, callback) {
        iotAgentLib.activate(config, function(err) {
            if (err) callback(err);
            else callback();
        });
    },

    register: function(device, callback) {
        iotAgentLib.register(device, function(err) {
            if (err) callback(err);
            else callback();
        });
    },

    getDevice: function(context, callback) {
        iotAgentLib.getDevice(context.id, context.service, context.subservice, function(err, device) {
            if (err) {
                not_found_context++;
                if (not_found_context > 10) callback(err);
            } else {
                not_found_context = 0;
                callback(null, device);
            }
        });
    },

    update: function(device, attributes, mapping, callback) {
        iotAgentLib.update(device.name, device.type, '', attributes, device, function(err) {
            if (err) callback(err);
            else callback();
        });
    },
    start(newConfig, callback) {
        iotAgentLib.activate(newConfig, function(err) {
            logger.info(logContext, 'Agent is running with multiCore property set to: ' + newConfig.multiCore);
            logger.info(logContext, 'Agent is running with relaxTemplateValidation property set to: ' + newConfig.relaxTemplateValidation );
            callback();
        });
    }
};
