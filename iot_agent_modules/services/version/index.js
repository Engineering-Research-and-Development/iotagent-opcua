'use strict';

var express = require('express');
var controller = require('./version.controller');

var router = express.Router();

router.get('/', controller.status);

module.exports = router;
