const { expect } = require('chai');
const rewire = require('rewire');
const mockDevice = require('../../mock/device.mock.json');

describe('IoT Agent util functions', () => {
    describe('When getEffectiveApiKey  ', () => {
        // Rewire all mocks
        const iotaUtils = rewire('../../../lib/iotaUtils');
        const configService = rewire('../../../lib/configService');
        const mockConfig = rewire('../../../conf/config-v2.example');
        const mockDevice = require('../../mock/device.mock.json');
        const mockGroup = require('../../mock/group.mock.json');
        const service = 'opcua_car';
        const subservice = '/demo';

        beforeEach(() => {
            iotaUtils.__set__('config.getConfig', () => {
                return mockConfig;
            });
        });

        describe('When device has an apikey', () => {
            it('Should return the apiKey of the device passed as parameter', (done) => {
                iotaUtils.getEffectiveApiKey(service, subservice, mockDevice, (error, apiKey) => {
                    expect(error).to.equal(null);
                    expect(apiKey).to.equal(mockDevice.apikey);
                    done();
                });
            });
        });

        describe('When device does not have an apikey', () => {
            beforeEach(() => {
                configService.setConfig(mockConfig);
                mockDevice.apikey = undefined;
            });

            describe('When device exists in mongodb', () => {
                beforeEach(() => {
                    iotaUtils.__set__('iotAgentLib.findConfiguration', (service, subservice, type, callback) => {
                        callback(null, mockGroup);
                    });
                });
                it('Should return the apiKey of the device found in mongodb', (done) => {
                    iotaUtils.getEffectiveApiKey(service, subservice, mockDevice, (error, apiKey) => {
                        expect(error).to.equal(null);
                        expect(apiKey).to.not.equal(null);
                        done();
                    });
                });
            });

            describe('When device does not exist in mongodb', () => {
                beforeEach(() => {
                    configService.setConfig(mockConfig);
                    iotaUtils.__set__('iotAgentLib.findConfiguration', (service, subservice, type, callback) => {
                        callback('Group not found', null);
                    });
                });
                it('Should return defaultApiKey from config', (done) => {
                    iotaUtils.getEffectiveApiKey(service, subservice, mockDevice, (error, apiKey) => {
                        expect(error).to.equal(null);
                        expect(apiKey).to.not.equal(null);
                        done();
                    });
                });
            });

            describe('When device does not exist in mongodb neither in config', () => {
                beforeEach(() => {
                    mockConfig.defaultKey = null;
                    iotaUtils.__set__('iotAgentLib.findConfiguration', (service, subservice, type, callback) => {
                        callback('Group not found', null);
                    });
                });
                it('Should return group not found error', (done) => {
                    iotaUtils.getEffectiveApiKey(service, subservice, mockDevice, (error) => {
                        expect(error).to.not.equal(null);
                        expect(error.name).to.equal('GROUP_NOT_FOUND');
                        done();
                    });
                });
            });
        });
    });

    describe('When retrieveDevice  ', () => {
        // Rewire all mocks
        const iotaUtils = rewire('../../../lib/iotaUtils');
        const mockConfig = rewire('../../../conf/config-v2.example');
        const mockDevice = require('../../mock/device.mock.json');
        const deviceId = 'age01_Car';
        const apiKey = 'iot';
        const transport = 'OPCUA';

        beforeEach(() => {
            iotaUtils.__set__('config.getConfig', () => {
                return mockConfig;
            });
        });

        describe('When device apikey equals config default api key', () => {
            describe('When device exists in mongodb', () => {
                beforeEach(() => {
                    iotaUtils.__set__('iotAgentLib.getDevicesByAttribute', (attributeName, attributeValue, service, subservice, callback) => {
                        callback(null, [mockDevice]);
                    });
                });
                it('Should return device found on mongo', (done) => {
                    iotaUtils.retrieveDevice(deviceId, apiKey, transport, (error, device) => {
                        expect(error).to.equal(null);
                        expect(device).to.equal(mockDevice);
                        done();
                    });
                });
            });
            describe('When device does not exist in mongodb', () => {
                beforeEach(() => {
                    iotaUtils.__set__('iotAgentLib.getDevicesByAttribute', (attributeName, attributeValue, service, subservice, callback) => {
                        callback('Device not found');
                    });
                });
                it('Should return device found on mongo', (done) => {
                    iotaUtils.retrieveDevice(deviceId, apiKey, transport, (error) => {
                        expect(error).to.not.equal(null);
                        done();
                    });
                });
            });
            describe('When more than one device exist in mongodb', () => {
                beforeEach(() => {
                    iotaUtils.__set__('iotAgentLib.getDevicesByAttribute', (attributeName, attributeValue, service, subservice, callback) => {
                        callback(null, [mockDevice, mockDevice]);
                    });
                });
                it('Should return device found on mongo', (done) => {
                    iotaUtils.retrieveDevice(deviceId, apiKey, transport, (error) => {
                        expect(error).to.not.equal(null);
                        expect(error.name).to.equal('DEVICE_NOT_FOUND');
                        done();
                    });
                });
            });
        });
    });
});
