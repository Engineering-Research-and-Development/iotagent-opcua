const { expect } = require('chai');
const rewire = require('rewire');

describe('Query handling', () => {
    // Rewire all mocks
    const queryHandler = rewire('../../../../lib/handlers/queryHandler');
    const configService = rewire('../../../../lib/configService');
    const mockConfig = require('../../../../conf/config-v2.example');
    const id = 'age01_Car';
    const type = 'Device';
    const service = 'opcua_car';
    const subservice = '/demo';
    const attributes = ['Speed'];
    const mockDevice = rewire('../../mock/device.mock.json');

    describe('When lazy attribute is requested and device exists', () => {
        beforeEach(() => {
            queryHandler.__set__('config.getLogger', () => {
                return {
                    error: (context, text) => {},
                    warn: (context, text) => {},
                    info: (context, text) => {},
                    fatal: (context, text) => {},
                    debug: (context, text) => {}
                };
            });
            queryHandler.__set__('iotAgentLib.getDeviceByName', (id, service, subservice, callback) => {
                callback(null, mockDevice);
            });
            queryHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                callback(null, mockDevice.apiKey);
            });
            queryHandler.__set__('transportSelector.createExecutionsForBinding', (thisArg, apiKey, device) => {
                return [];
            });
        });

        it('Should prepare and execute query', (done) => {
            queryHandler.handler(id, type, service, subservice, attributes, (error) => {
                expect(error).to.equal(null);
                done();
            });
        });
    });

    describe('When lazy attribute is requested and device exists but not lazy attributes inside it', () => {
        beforeEach(() => {
            mockDevice.lazy = null;
            queryHandler.__set__('config.getLogger', () => {
                return {
                    error: (context, text) => {},
                    warn: (context, text) => {},
                    info: (context, text) => {},
                    fatal: (context, text) => {},
                    debug: (context, text) => {}
                };
            });
            queryHandler.__set__('config.getConfig', () => {
                return mockConfig;
            });
            queryHandler.__set__('iotAgentLib.getDeviceByName', (id, service, subservice, callback) => {
                callback(null, mockDevice);
            });
            queryHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                callback(null, mockDevice.apiKey);
            });
            queryHandler.__set__('transportSelector.createExecutionsForBinding', (thisArg, apiKey, device) => {
                return [];
            });
        });

        it('Should read lazy attributes from config, prepare and execute query', (done) => {
            queryHandler.handler(id, type, service, subservice, attributes, (error) => {
                expect(error).to.equal(null);
                done();
            });
        });
    });

    describe('When lazy attribute is requested and device exists but not the apiKey', () => {
        beforeEach(() => {
            queryHandler.__set__('iotAgentLib.getDeviceByName', (id, service, subservice, callback) => {
                callback(null, mockDevice);
            });
            queryHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                callback('Api Key not found', null);
            });
        });

        it('Should return an error', (done) => {
            queryHandler.handler(id, type, service, subservice, attributes, (error) => {
                expect(error).to.not.equal(null);
                done();
            });
        });
    });

    describe('When lazy attribute is requested and device does not exists', () => {
        beforeEach(() => {
            queryHandler.__set__('iotAgentLib.getDeviceByName', (id, service, subservice, callback) => {
                callback('Device not found', null);
            });
        });

        it('Should return an error', (done) => {
            queryHandler.handler(id, type, service, subservice, attributes, (error) => {
                expect(error).to.not.equal(null);
                done();
            });
        });
    });
});
