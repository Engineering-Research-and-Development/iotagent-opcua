const { expect } = require('chai');
const rewire = require('rewire');

describe('IoT Agent util functions', () => {
    // Rewire all mocks
    const iotaUtils = rewire('../../../lib/iotaUtils');
    const configService = rewire('../../../lib/configService');
    const mockConfig = rewire('../../../conf/config-v2.example');
    const mockDevice = rewire('../../mock/device.mock.json');
    const mockGroup = rewire('../../mock/group.mock.json');
    const service = 'opcua_car';
    const subservice = '/demo';

    describe('When getEffectiveApiKey  ', () => {
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
                    iotaUtils.getEffectiveApiKey(service, subservice, mockDevice, (error, apiKey) => {
                        expect(error).to.not.equal(null);
                        expect(error.name).to.equal('GROUP_NOT_FOUND');
                        done();
                    });
                });
            });
        });
    });
});
