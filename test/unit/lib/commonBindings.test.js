const { expect } = require('chai');
const rewire = require('rewire');

describe('Common bindings', () => {
    // Rewire all mocks
    const commonBindings = rewire('../../../lib/commonBindings');
    const mockConfig = rewire('../../../conf/config-v2.example');
    const mockDevice = rewire('../mock/device.mock.json');
    const mapping = {
        ocb_id: 'CarSpeed',
        opcua_id: 'ns=3;s=Speed',
        object_id: null,
        inputArguments: []
    };
    const deviceId = 'age01_Car';
    const apiKey = 'iot';
    const protocol = 'OPCUA';
    const variableValue = 0;
    describe('When opcuaMessageHandler is called', () => {
        describe('When device exists', () => {
            describe('When single measure is successfully updated', () => {
                it('Should terminate well southbound transaction', (done) => {
                    commonBindings.__set__('config.getConfig', () => {
                        return mockConfig;
                    });
                    commonBindings.__set__('iotaUtils.retrieveDevice', (deviceId, apiKey, protocol, cb) => {
                        cb(null, mockDevice);
                    });
                    commonBindings.__set__('iotAgentLib.update', (deviceName, deviceType, apiKey, values, device, cb1) => {
                        cb1(null);
                    });
                    commonBindings.opcuaMessageHandler(deviceId, mapping, variableValue, null);
                    done();
                });
            });
            describe('When single measure update fails', () => {
                it('Should log an error and terminate southbound transaction', (done) => {
                    commonBindings.__set__('config.getConfig', () => {
                        return mockConfig;
                    });
                    commonBindings.__set__('iotaUtils.retrieveDevice', (deviceId, apiKey, protocol, cb) => {
                        cb(null, mockDevice);
                    });
                    commonBindings.__set__('iotAgentLib.update', (deviceName, deviceType, apiKey, values, device, cb1) => {
                        cb1('Error updating');
                    });
                    commonBindings.opcuaMessageHandler(deviceId, mapping, variableValue, null);
                    done();
                });
            });
            describe('When multiple measures (commands.CONFIGURATION_COMMAND_UPDATE) is successfully updated', () => {
                it('Should terminate well southbound transaction', (done) => {
                    const valuesArray = [
                        {
                            CarEngine_Temperature: 20
                        },
                        {
                            CarEngine_Oxigen: 10
                        }
                    ];
                    const emptyMapping = {
                        ocb_id: '',
                        opcua_id: 'ns=3;s=Speed',
                        object_id: null,
                        inputArguments: []
                    };
                    commonBindings.__set__('config.getConfig', () => {
                        return mockConfig;
                    });
                    commonBindings.__set__('iotaUtils.retrieveDevice', (deviceId, apiKey, protocol, cb) => {
                        cb(null, mockDevice);
                    });
                    commonBindings.__set__('iotAgentLib.update', (deviceName, deviceType, apiKey, values, device, cb1) => {
                        cb1(null);
                    });
                    commonBindings.opcuaMessageHandler(deviceId, emptyMapping, JSON.stringify(valuesArray), null);
                    done();
                });
            });
        });
    });
});
