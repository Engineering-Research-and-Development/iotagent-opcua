const { expect } = require('chai');
const config = require('../../../lib/configService');
const mockConfig = require('../../../conf/config-v2.example');

describe('configService.js tests', () => {
    it('Should load env variables', (done) => {
        config.setConfig(mockConfig.config);
        expect(mockConfig.config).to.equal(config.getConfig());
        done();
    });
});
