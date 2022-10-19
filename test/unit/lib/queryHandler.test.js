const { expect } = require('chai');
const logops = require('logops');
const rewire = require('rewire');

describe('Query handling', () => {
    // Rewire all mocks
    const queryHandler = rewire('../../../lib/queryHandler');
    const configService = rewire('../../../lib/configService');
    const mockConfig = rewire('../../../conf/config-v2.example');
    const id = 'age01_Car';
    const type = 'Device';
    const service = 'opcua_car';
    const subservice = '/demo';
    const attributes = ['Speed'];
    const mockDevice = rewire('../../mock/device.mock.json');

    queryHandler.__set__('iotAgentLib.getDeviceByName', (id, service, subservice, callback) => {
        callback(null, mockDevice);
    });
    queryHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
        callback(null, mockDevice.apiKey);
    });
    queryHandler.__set__('transportSelector.createExecutionsForBinding', (thisArg, apiKey, device) => {
        return [];
    });

    describe('When lazy attribute is requested and device exists', () => {
        beforeEach(() => {
            configService.setConfig(mockConfig);
        });

        it('Should prepare and execute query', (done) => {
            queryHandler.handler(id, type, service, subservice, attributes, () => {
                done();
            });
        });
    });
});
