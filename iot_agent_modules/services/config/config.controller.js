var package = require('../../../package');
const fs = require('fs');

('use strict');

// Get config information
exports.status = function(req, res) {
    var result = {};
    var config = require('./../../../conf/config.json');
    result.config = config;

    return res.status(200).json(result);
};
