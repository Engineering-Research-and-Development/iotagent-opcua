'use strict';

var express = require('express');
var controller = require('./status.controller');

var router = express.Router();

router.get('/', controller.status);

module.exports = router;
