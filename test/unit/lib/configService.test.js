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
            process.env.IOTA_LOGLEVEL = 'test';
            process.env.IOTA_TIMESTAMP = 'test';
            process.env.IOTA_CB_HOST = 'test';
            process.env.IOTA_CB_PORT = 'test';
            process.env.IOTA_CB_NGSIVERSION = 'test';
            process.env.IOTA_CB_NGSILDCONTEXT = 'test';
            process.env.IOTA_CB_SERVICE = 'test';
            process.env.IOTA_CB_SUBSERVICE = 'test';
            process.env.IOTA_NORTH_PORT = 'test';
            process.env.IOTA_REGISTRY_TYPE = 'test';
            process.env.IOTA_MONGO_HOST = 'test';
            process.env.IOTA_MONGO_PORT = 'test';
            process.env.IOTA_MONGO_DB = 'test';
            process.env.IOTA_SERVICE = 'test';
            process.env.IOTA_SUBSERVICE = 'test';
            process.env.IOTA_PROVIDER_URL = 'test';
            process.env.IOTA_DEVICEREGDURATION = 'test';
            process.env.IOTA_DEFAULTTYPE = 'test';
            process.env.IOTA_DEFAULTRESOURCE = 'test';
            process.env.IOTA_EXPLICITATTRS = 'test';
            process.env.IOTA_EXTENDED_FORBIDDEN_CHARACTERS = 'test';
            process.env.IOTA_AUTOPROVISION = 'test';
            process.env.IOTA_EXPRESS_LIMIT = 'test';
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
            process.env.IOTA_OPCUA_MT_STORE_OUTPUT = 'test';
            process.env.IOTA_OPCUA_SUBSCRIPTION_NOTIFICATIONS_PER_PUBLISH = 'test';
            process.env.IOTA_OPCUA_SUBSCRIPTION_PUBLISHING_ENABLED = 'test';
            process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_LIFETIME_COUNT = 'test';
            process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_MAX_KEEP_ALIVE_COUNT = 'test';
            process.env.IOTA_OPCUA_SUBSCRIPTION_REQ_PUBLISHING_INTERVAL = 'test';
            process.env.IOTA_OPCUA_SUBSCRIPTION_PRIORITY = 'test';
        });

        it('Should hide USERNAME and PASSWORD env variables', (done) => {
            configService.setConfig(mockConfig);
            done();
        });
    });
});
