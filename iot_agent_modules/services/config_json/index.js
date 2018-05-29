'use strict';

var express = require('express');
var controller = require('./config_json.controller');

var router = express.Router();

router.post('/', controller.write);

module.exports = router;
