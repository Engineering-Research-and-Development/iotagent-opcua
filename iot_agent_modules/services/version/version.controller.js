var package = require('../../../package');

('use strict');

// Get version information
exports.status = function(req, res) {
    var result = {};
    result.name = package.name;
    result.description = package.description;
    result.version = package.version;
    return res.status(200).json(result);
};
