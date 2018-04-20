var fs = require("fs");
var path = require("path");
var deassertify = require("..");
var concat = require("concat-stream");
var should = require("should");

describe("testing desassertify", function () {
    var files = fs.readdirSync(path.join(__dirname, "fixtures"));

    function test_file(file, done) {
        var filePath = path.join(__dirname, "fixtures", file);
        var opts = "";
        fs.createReadStream(filePath)
            .pipe(deassertify(filePath, opts))
            .pipe(concat({encoding: 'string'},
                function (stripped) {
                    fs.readFile(path.join(__dirname, "expected", file), "utf8", function (err, expectation) {
                        should(err).eql(null, "No error reading expectation file");
                        stripped.should.eql(expectation, "Transformed file contents equal expected file contents");
                        done();
                    });
                }));
    }

    it("should comment out asserts statement in code", function (done) {
        var file = "script1.js";
        test_file(file, done);
    });
    it("should comment out mutli line asserts statement in code", function (done) {
        var file = "script2.js";
        test_file(file, done);
    });
});

describe("testing desassertify no require", function () {
    var files = fs.readdirSync(path.join(__dirname, "fixtures"));

    function test_file(file, done) {
        var filePath = path.join(__dirname, "fixtures", file);
        var opts = {nobundle: true};
        fs.createReadStream(filePath)
            .pipe(deassertify(filePath, opts))
            .pipe(concat({encoding: 'string'},
                function (stripped) {
                    //xx console.log(stripped);
                    fs.readFile(path.join(__dirname, "expected", "nobundle-" + file), "utf8", function (err, expectation) {
                        should(err).eql(null, "No error reading expectation file");
                        stripped.should.eql(expectation, "Transformed file contents equal expected file contents");
                        done();
                    });
                }));
    }

    it("should comment out asserts statement in code", function (done) {
        var file = "script1.js";
        test_file(file, done);
    });
    it("should comment out mutli line asserts statement in code", function (done) {
        var file = "script2.js";
        test_file(file, done);
    });
});
