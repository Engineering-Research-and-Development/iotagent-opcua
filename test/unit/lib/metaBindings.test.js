const rewire = require('rewire');
const chai = require('chai');

describe('MetaBinding handling', () => {
    const metaBindings = rewire('../../../lib/metaBindings.js');
    const mockConfig = rewire('../../../conf/config-v2.example');

    metaBindings.__set__('httpRequest', (options, body) => {
        return new Promise(function (resolve, reject) {
            resolve(true);
        });
    });

    describe('Make auto-provisioning of Group and Device', () => {
        beforeEach(() => {
            metaBindings.__set__('config.getConfig', () => {
                return mockConfig;
            });
        });

        describe('When createGroupResult is not true', () => {
            beforeEach(() => {
                metaBindings.__set__('createGroup', () => {
                    return false;
                });
                metaBindings.__set__('createDevices', () => {
                    return true;
                });
            });
            it('Should throw a new Error exception', (done) => {
                metaBindings
                    .performAutoProvisioning()
                    .then(function () {})
                    .catch(function () {
                        done();
                    });
            });
        });

        describe('When createDevicesResult is not true', () => {
            beforeEach(() => {
                metaBindings.__set__('createGroup', () => {
                    return true;
                });
                metaBindings.__set__('createDevices', () => {
                    return false;
                });
            });

            it('Should throw a new Error exception', (done) => {
                metaBindings
                    .performAutoProvisioning()
                    .then(function () {})
                    .catch(function () {
                        done();
                    });
            });
        });

        describe('When createGroup and createDevicesResult are true', () => {
            beforeEach(() => {
                metaBindings.__set__('createGroup', () => {
                    return false;
                });
                metaBindings.__set__('createDevices', () => {
                    return false;
                });
            });

            it('Should throw a new Error exception', (done) => {
                metaBindings
                    .performAutoProvisioning()
                    .then(function () {})
                    .catch(function () {
                        done();
                    });
            });
        });
    });
});
