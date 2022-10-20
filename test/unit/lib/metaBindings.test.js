const rewire = require('rewire');
const mockConfig = require('../../../conf/config-v2.example');

describe('MetaBinding handling', () => {
    const metaBindings = rewire('../../../lib/metaBindings.js');

    describe('Make auto-provisioning of Group and Device', () => {
        beforeEach(() => {
            metaBindings.__set__('config.getConfig', () => {
                return mockConfig;
            });
            metaBindings.__set__('http.request', (options, res_callback) => {
                return {
                    on: function(type, on_callback){},
                    write: function(string){},
                    end: function(){
                        res_callback({
                            statusCode: 204,
                            on: function(type, chunk_callback){
                                if(type==="data"){
                                    chunk_callback(new Buffer.from("{}"));
                                }
                                if(type==="end"){
                                    chunk_callback();
                                }
                            }
                        });
                    }
                }
            });
        });

        describe('When createGroup and createDevicesResult are true', () => {
            it('Should make autoprovisioning', (done) => {
                metaBindings
                    .performAutoProvisioning()
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
                        on: function(type, on_callback){},
                        write: function(string){},
                        end: function(){
                            res_callback({
                                statusCode: 409,
                                on: function(type, chunk_callback){
                                    if(type==="data"){
                                        chunk_callback(new Buffer.from("{}"));
                                    }
                                    if(type==="end"){
                                        chunk_callback();
                                    }
                                }
                            });
                        }
                    }
                });
            });

            it('Should make autoprovisioning', (done) => {
                metaBindings
                    .performAutoProvisioning()
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
                        on: function(type, on_callback){},
                        write: function(string){},
                        end: function(){
                            res_callback({
                                statusCode: 400,
                                on: function(type, chunk_callback){
                                    if(type==="data"){
                                        chunk_callback(new Buffer.from("{}"));
                                    }
                                    if(type==="end"){
                                        chunk_callback();
                                    }
                                }
                            });
                        }
                    }
                });
            });

            it('Should make autoprovisioning', (done) => {
                metaBindings
                    .performAutoProvisioning()
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
                    .performAutoProvisioning()
                    .then(function () {
                        done();
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
                    .performAutoProvisioning()
                    .then(function () {
                        done();
                    })
                    .catch(function () {
                        done();
                    });
            });
        });

    });
});
