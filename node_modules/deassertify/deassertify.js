var through = require("through2")
    , falafel = require("falafel");

module.exports = function (file, opts) {
    if (/\.json$/.test(file)) return through();

    opts = opts || {nobundle: false};

    var data = "";

    return through(
        function (buf, enc, cb) {
            data += buf
            cb()
        },
        function (cb) {
            try {
                this.push(String(parse(data, opts)))
            } catch (er) {
                return cb(new Error(er.toString().replace("Error: ", "") + " (" + file + ")"))
            }
            cb()
        })
};

function parse(data, opts) {
    return falafel(data, function (node) {
        if (opts.nobundle && node.type == "VariableDeclaration" && node.source().match(/require\(.{1}assert/)) {
            return node.update(node.source().split(/\n|\r/).map(function (f) {
                return "//-- " + f;
            }).join("\n"));
        }

        if (node.type != "DebuggerStatement" && (node.type != "CallExpression" || !isAssert(node.callee))) {
            return;
        }
        node.update(node.source().split(/\n|\r/).map(function (f) {
            return "//-- " + f;
        }).join("\n"));
    });
}

function isAssert(node) {
    if (!node) {
        return false;
    }
    if (node.type != "Identifier") {
        return false;
    }
    return node.type == "Identifier" && node.name == "assert";
}
