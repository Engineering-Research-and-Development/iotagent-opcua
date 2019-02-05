var constants = require('iotagent-node-lib');
var async = require('async');
var ngsi = require('iotagent-node-lib');

module.exports = {
    executeUpdateValues: function(device, id, type, service, subservice, attributes, status, value, callback) {
        var sideEffects = [];
        if (device.commands) {
            for (var i = 0; i < device.commands.length; i++) {
                for (var j = 0; j < attributes.length; j++) {
                    if (device.commands[i].name === attributes[j].name) {
                        var newAttributes = [
                            {
                                name: device.commands[i].name + '_status',
                                type: constants.COMMAND_STATUS,
                                value: status
                            },
                            {
                                name: device.commands[i].name + '_info',
                                type: constants.COMMAND_RESULT,
                                value: value
                            }
                        ];

                        sideEffects.push(
                            async.apply(ngsi.update, device.id, device.resource, device.apikey, newAttributes, device)
                        );
                    }
                }
            }
        }

        async.series(sideEffects, function _restParam(func, startIndex) {
            startIndex = startIndex == null ? func.length - 1 : +startIndex;
            return function() {
                var length = Math.max(arguments.length - startIndex, 0);
                var rest = Array(length);
                for (var index = 0; index < length; index++) {
                    rest[index] = arguments[index + startIndex];
                }
                switch (startIndex) {
                    case 0:
                        return func.call(this, rest);
                    case 1:
                        return func.call(this, arguments[0], rest);
                }
            };
        });
    }
};
