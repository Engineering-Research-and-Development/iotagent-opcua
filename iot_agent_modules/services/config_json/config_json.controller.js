'use strict';

// Get list of sensorMeasures
exports.write = function(req, res) {
    var logger = require('logops');
    var fs = require('fs');
    var tAs = require('./../../run/terminateAllSubscriptions');

    tAs.terminateAllSubscriptions(the_subscriptions);

    var d = new Date();
    var n = d
        .toISOString()
        .substring(0, 19)
        .replace(/\D/g, '');

    fs.rename('./conf/config.json', './conf/' + n + 'config.json', function(err) {
        if (err) logger.info('error on renaming config.json file: ' + err);
    });

    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
    });
    req.on('end', () => {
        fs.writeFile('./conf/config.json', body, function(err) {
            if (err) {
                logger.info('Update failed: ' + err);
            } else {
                return res.status(200).json('The file was updated!');
            }
        });
    });
};
