const { expect } = require('chai');
const logops = require('logops');
const rewire = require('rewire');

describe('Configuration startup tests', () => {
    // Rewire all mocks
    const configService = rewire('../../../lib/configService');
    const mockConfig = rewire('../../../conf/config-v2.example');

    describe('When environmental variables are not set', () => {
        it('Should load configuration file', (done) => {
            configService.setConfig(mockConfig);
            expect(mockConfig).to.equal(configService.getConfig());
            done();
        });

        it('Should set a logger', (done) => {
            configService.setLogger(logops);
            expect(logops).to.equal(configService.getLogger());
            done();
        });
    });

    describe('When environmental variables are set', () => {
        beforeEach(() => {
            process.env.IOTA_CONFIG_RETRIEVAL = 'test';
            process.env.IOTA_DEFAULT_KEY = 'test';
            process.env.IOTA_DEFAULT_TRANSPORT = 'test';
            process.env.IOTA_OPCUA_ENDPOINT = 'test';
            process.env.IOTA_OPCUA_SECURITY_MODE = 'test';
            process.env.IOTA_OPCUA_SECURITY_POLICY = 'test';
            process.env.IOTA_OPCUA_SECURITY_USERNAME = 'test';
            process.env.IOTA_OPCUA_SECURITY_PASSWORD = 'test';
            process.env.IOTA_OPCUA_UNIQUE_SUBSCRIPTION = 'test';
            process.env.IOTA_OPCUA_MT_POLLING = 'test';
            process.env.IOTA_OPCUA_MT_AGENT_ID = 'test';
            process.env.IOTA_OPCUA_MT_ENTITY_ID = 'test';
            process.env.IOTA_OPCUA_MT_ENTITY_TYPE = 'test';
            process.env.IOTA_OPCUA_MT_NAMESPACE_IGNORE = 'test';
        });

        it('Should hide USERNAME and PASSWORD env variables', (done) => {
            configService.setConfig(mockConfig);
            done();
        });
    });
});
