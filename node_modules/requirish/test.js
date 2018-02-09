require('should');
var path = require('path');


console.log(module.paths);

describe('requirish', function () {

    describe('#_()', function () {
        it('should manage module.paths === undefined', function (done) {
            require('requirish')._({});
            done();
        });
    });
    describe('#_()', function () {
        it('should work on unix', function (done) {
            var module = {
                paths: ['folder1'],
                filename: '/Users/bob/MyApp/node_modules/sub-module1/node_modules/sub-module2/lib/index.js'
            };
            path.sep = '/';
            require('requirish')._(module);
            module.paths[0].should.be.equal('/Users/bob/MyApp/node_modules/sub-module1/node_modules/sub-module2');
            done();
        });
    });
    describe('#_()', function () {
        it('should work on win', function (done) {
            var module = {
                paths: [],
                filename: 'c:\\Users\\bob\\MyApp\\node_modules\\sub-module1\\node_modules\\sub-module2\\lib\\index.js'
            };
            path.sep = '\\';
            require('requirish')._(module);
            module.paths[0].should.be.equal('c:\\Users\\bob\\MyApp\\node_modules\\sub-module1\\node_modules\\sub-module2');
            done();
        });
    });
    describe('#_()', function () {
        it('should add the current dir', function (done) {
            var module = {
                paths: ['folder1'],
                filename: 'c:\\Users\\bob\\MyApp\\lib\\index.js'
            };
            path.sep = '\\';
            require('requirish')._(module);
            module.paths[0].should.be.equal('.');
            done();
        });
    });
});

