const rewire = require('rewire');
const { assert } = require('chai');

describe('MetaBinding handling', () => {
    const metaBindings = rewire('../../../lib/metaBindings.js');
    const mockConfig = require('../../../conf/config-v2.example');

    describe('Make auto-provisioning of Group and Device', () => {
        beforeEach(() => {
            metaBindings.__set__('config.getConfig', () => {
                return mockConfig;
            });
            metaBindings.__set__('http.request', (options, res_callback) => {
                return {
                    on(type, on_callback) {},
                    write(string) {},
                    end() {
                        res_callback({
                            statusCode: 204,
                            on(type, chunk_callback) {
                                if (type === 'data') {
                                    chunk_callback(new Buffer.from('{}'));
                                }
                                if (type === 'end') {
                                    chunk_callback();
                                }
                            }
                        });
                    }
                };
            });
        });

        describe('When createGroup and createDevicesResult are true', () => {
            it('Should make autoprovisioning', (done) => {
                metaBindings
                    .performProvisioning()
                    .then(function () {
                        done();
                    })
                    .catch(function () {
                        done();
                    });
            });
        });

        describe('When createGroup and createDevicesResult are true and device already exists', () => {
            beforeEach(() => {
                metaBindings.__set__('http.request', (options, res_callback) => {
                    return {
                        on(type, on_callback) {},
                        write(string) {},
                        end() {
                            res_callback({
                                statusCode: 409,
                                on(type, chunk_callback) {
                                    if (type === 'data') {
                                        chunk_callback(new Buffer.from('{}'));
                                    }
                                    if (type === 'end') {
                                        chunk_callback();
                                    }
                                }
                            });
                        }
                    };
                });
            });

            it('Should make autoprovisioning', (done) => {
                metaBindings
                    .performProvisioning()
                    .then(function () {
                        done();
                    })
                    .catch(function () {
                        done();
                    });
            });
        });

        describe('When createGroup and createDevicesResult are true and error is returned', () => {
            beforeEach(() => {
                metaBindings.__set__('http.request', (options, res_callback) => {
                    return {
                        on(type, on_callback) {},
                        write(string) {},
                        end() {
                            res_callback({
                                statusCode: 400,
                                on(type, chunk_callback) {
                                    if (type === 'data') {
                                        chunk_callback(new Buffer.from('{}'));
                                    }
                                    if (type === 'end') {
                                        chunk_callback();
                                    }
                                }
                            });
                        }
                    };
                });
            });

            it('Should make autoprovisioning', (done) => {
                metaBindings
                    .performProvisioning()
                    .then(function () {
                        done();
                    })
                    .catch(function () {
                        done();
                    });
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
                    .performProvisioning()
                    .then(function () {
                        assert.fail('No exception thrown', 'Throw exception', 'It should throw an exception');
                    })
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
                    .performProvisioning()
                    .then(function () {
                        assert.fail('No exception thrown', 'Throw exception', 'It should throw an exception');
                    })
                    .catch(function () {
                        done();
                    });
            });
        });
    });
});
