'use strict';

// Get list of sensorMeasures
exports.write = function(req, res) {
  var logger = require('logops');
  var fs = require('fs');
  var tAs = require ('./../../run/terminateAllSubscriptions');

  Date.prototype.YYYYMMDDHHMMSS = function () {
        var yyyy = this.getFullYear().toString();
        var MM = (this.getMonth() + 1,2);
        var dd = (this.getDate(), 2);
        var hh = (this.getHours(), 2);
        var mm = (this.getMinutes(), 2);
        var ss = (this.getSeconds(), 2);

        return yyyy + MM + dd+  hh + mm + ss;
    };
tAs.terminateAllSubscriptions(the_subscriptions);
  var timestamp = new Date();
  fs.rename('./conf/config.json', './conf/'+timestamp.YYYYMMDDHHMMSS()+'config.json', function(err) {
    if ( err ) logger.info("error on renaming config.json file: " + err);
  })

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    fs.writeFile("./conf/config.json", body, function(err) {
      if(err) {
        logger.info("Update failed: "+ err);
      }
      else{
        return res.status(200).json("The file was updated!");
      }
    });

  });
}
