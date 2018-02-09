//     requirish
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/requirish

// The require('...') regular expression
var requireRegExp = /require\s*\(\s*(["'])(.*?)\1\s*\)\s*/g;
// The transform function
module.exports = function (file) {
    // Import dependencies
    var path = require('path');
    var through = require('through2');
    var resolve = require('resolve');
    // Retrieve the file relative path
    var fileFolder = path.dirname(file);
    var relativeToRoot = path.relative(fileFolder, '.');
    // Transform `require(..)`
    return through(function (buf, enc, next) {
        this.push(buf.toString('utf8').replace(requireRegExp, replacer));
        next();
    });
    // `require(..)` replacer
    function replacer(match, quote, require) {
        var replacement = 'require(' + quote;
        try {
            resolve.sync(require);
        } catch (exc) {
            try {
                // Try to resolve the require statement starting from the root folder
                resolve.sync(require, {paths: ['.']});
                replacement += relativeToRoot + path.sep;
            } catch (exc2) {
            }
        }
        replacement += require + quote + ')';
//        console.log(replacement);
        return replacement;
    }
};
// Modify the module internal paths
var nodeModulesRegExp;
var lastPathSep;
function _(module) {
    if (module.paths && module.filename) {
        var pathSep = require('path').sep;
        pathSep = pathSep === '/' ? pathSep : pathSep + pathSep;
        nodeModulesRegExp = lastPathSep === pathSep ?
            nodeModulesRegExp :
            new RegExp('^(.*' + pathSep + 'node_modules' + pathSep + '[A-Za-z0-9_-]*)' + pathSep + '.*');
        lastPathSep = pathSep;
        var root = (module.filename.match(nodeModulesRegExp) || [undefined, '.'])[1];
        module.paths.splice(0, 0, root);
    }
}
module.exports._ = _;
