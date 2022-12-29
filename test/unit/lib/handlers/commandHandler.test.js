const { expect } = require('chai');
const rewire = require('rewire');

describe('Command handling', () => {
    // Rewire all mocks
    const commandHandler = rewire('../../../../lib/handlers/commandHandler');
    const id = 'age01_Car';
    const type = 'Device';
    const service = 'opcua_car';
    const subservice = '/demo';
    const attributes = [
        {
            name: 'Accelerate',
            value: 10
        }
    ];
    const apiKey = 'iot';
    const mockDevice = rewire('../../mock/device.mock.json');

    describe('When command handler is triggered', () => {
        describe('When device does not exist', () => {
            it('Should return an error', (done) => {
                commandHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                    callback('COMMAND-001: Command execution could not be handled');
                });
                commandHandler.handler(id, type, service, subservice, attributes, (err) => {
                    expect(err).to.equal('COMMAND-001: Command execution could not be handled');
                    done();
                });
            });
        });
        describe('When device exists and api key does not exist', () => {
            it('Should return an error', (done) => {
                commandHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                    callback(null, mockDevice);
                });
                commandHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                    callback('Could not find any API Key information for device.');
                });
                commandHandler.handler(id, type, service, subservice, attributes, (err) => {
                    expect(err).to.equal('Could not find any API Key information for device.');
                    done();
                });
            });
        });
        describe('When device and api key exist', (done) => {
            describe('When command does not have an expression', (done) => {
                it('Should set the payload and continue the iotagent-node-lib flow command handling', (done) => {
                    commandHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                        callback(null, mockDevice);
                    });
                    commandHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                        callback(null, apiKey);
                    });
                    commandHandler.__set__('transportSelector.createExecutionsForBinding', (thisArg, apiKey, device) => {
                        return [];
                    });
                    commandHandler.handler(id, type, service, subservice, attributes, (err) => {
                        expect(err).to.equal(undefined);
                        done();
                    });
                });
            });
            describe('When command has an expression', (done) => {
                it('Should prepare the payload and continue the iotagent-node-lib flow command handling', (done) => {
                    commandHandler.__set__('iotAgentLib.getDeviceByNameAndType', (id, type, service, subservice, callback) => {
                        callback(null, mockDevice);
                    });
                    commandHandler.__set__('iotaUtils.getEffectiveApiKey', (service, subservice, device, callback) => {
                        callback(null, apiKey);
                    });
                    commandHandler.__set__('transportSelector.createExecutionsForBinding', (thisArg, apiKey, device) => {
                        return [];
                    });
                    mockDevice.commands = [
                        {
                            name: 'Accelerate',
                            type: 'command',
                            object_id: 'Accelerate',
                            expression: 'some expression'
                        }
                    ];
                    commandHandler.__set__('iotAgentLib.dataPlugins.expressionTransformation', {
                        extractContext: () => {
                            return {};
                        },
                        applyExpression: () => {
                            return {};
                        }
                    });
                    commandHandler.handler(id, type, service, subservice, attributes, (err) => {
                        expect(err).to.equal(undefined);
                        done();
                    });
                });
            });
        });
    });

    describe('When updating command status', () => {
        // Rewire all mocks
        const id = 'age01_Car';
        const apiKey = 'iot';
        const messageObj = {
            Accelerate: {
                type: 'command',
                value: 10
            }
        };

        describe('When command status update is triggered', () => {
            it('Should set command status and continue the flow', (done) => {
                commandHandler.__set__('iotAgentLib.setCommandResult', (entityName, resource, apikey, commandName, commandResult, status, deviceInformation, callback) => {
                    callback(null, {});
                });
                commandHandler.updateCommand(apiKey, id, mockDevice, messageObj);
                done();
            });
        });
    });
});
