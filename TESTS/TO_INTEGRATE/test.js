const verifyAdminAPI = require('./verifyAdminAPI');

describe('verify admin api', function() {
    it('verify version service', verifyAdminAPI.verifyVersionService);
    it('verify status service', verifyAdminAPI.verifyStatusService);
    it('verify config service', verifyAdminAPI.verifyConfigService);
    it('verify commandsList service', verifyAdminAPI.verifyCommandsListService);
});
