const { expect } = require('chai');
const rewire = require('rewire');

describe('Update handling', () => {
    // Rewire all mocks
    const updateHandler = rewire('../../../../lib/handlers/updateHandler');
    const id = 'age01_Car';
    const type = 'Device';
    const service = 'opcua_car';
    const subservice = '/demo';
    const attributes = [
        {
            name: 'Speed',
            value: 10
        }
    ];
    const apiKey = 'iot';
    const mockDevice = rewire('../../mock/device.mock.json');

    describe('When update handler is triggered', () => {
        describe('When device does not exist', () => {
            it('Should return an error', (done) => {
                updateHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                    callback('UPDATE-001: Update execution could not be handled');
                });
                updateHandler.handler(id, type, service, subservice, attributes, (err) => {
                    expect(err).to.equal('UPDATE-001: Update execution could not be handled');
                    done();
                });
            });
        });
        describe('When device exists and api key does not exist', () => {
            it('Should return an error', (done) => {
                updateHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                    callback(null, mockDevice);
                });
                updateHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                    callback('Could not find any API Key information for device.');
                });
                updateHandler.handler(id, type, service, subservice, attributes, (err) => {
                    expect(err).to.equal('Could not find any API Key information for device.');
                    done();
                });
            });
        });
        describe('When device and api key exist', (done) => {
            describe('When update does not have an expression', (done) => {
                it('Should set the payload and continue the iotagent-node-lib flow update handling', (done) => {
                    updateHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                        callback(null, mockDevice);
                    });
                    updateHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                        callback(null, apiKey);
                    });
                    updateHandler.__set__('transportSelector.createExecutionsForBinding', (thisArg, apiKey, device) => {
                        return [];
                    });
                    updateHandler.handler(id, type, service, subservice, attributes, (err) => {
                        expect(err).to.equal(undefined);
                        done();
                    });
                });
            });
        });
    });

    describe('When update is triggered', () => {
        it('Should continue the iotagent-node-lib flow', (done) => {
            updateHandler.handler(apiKey, mockDevice.id, mockDevice, {});
            done();
        });
    });
});
