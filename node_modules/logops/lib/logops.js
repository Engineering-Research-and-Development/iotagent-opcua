/**
 * @license
 * Copyright 2015 Telefonica Investigación y Desarrollo, S.A.U
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var formatters = require('./formatters');

var levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    currentLevel,
    DEFAULT_LEVEL = 'INFO',
    API = {};

/*
 * Shorcuts
 */
var toString = Object.prototype.toString,
    noop = function noop() {};

/**
 * Internal private function that implements a decorator to all
 * the level functions.
 *
 * @param {String} level one of
 *   ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
 */
function logWrap(level) {
  var context, message, args, trace, err;

  if (arguments[1] instanceof Error) {
    // log.<level>(err, ...)
    context = API.getContext();
    args = Array.prototype.slice.call(arguments, 2);
    if (!args.length) {
      // log.<level>(err)
      err = arguments[1];
      message = err.name + ': ' + err.message;
    } else {
      // log.<level>(err, "More %s", "things")
      // Use the err as context information
      err = arguments[1];
      message = arguments[2];
      args = Array.prototype.slice.call(args, 1);
    }
  } else if ((typeof (arguments[1]) !== 'object' && arguments[1] !== null) ||
      arguments[1] == null ||
      Array.isArray(arguments[1])) {
    // log.<level>(msg, ...)
    context = API.getContext();
    message = arguments[1];
    args = Array.prototype.slice.call(arguments, 2);
  } else {
    // log.<level>(fields, msg, ...)
    context = merge(API.getContext(), arguments[1]);
    message = arguments[2];
    args = Array.prototype.slice.call(arguments, 3);
  }

  trace = API.format(level, context || {}, message, args, err);
  API.stream.write(trace + '\n');
}

/**
 * Merges accesible properties in two objects.
 * obj2 takes precedence when common properties are found
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns {{}} The merged, new, object
 */
function merge(obj1, obj2) {
  var res = {}, attrname;
  for (attrname in obj1) {
    res[attrname] = obj1[attrname];
  }
  for (attrname in obj2) {
    res[attrname] = obj2[attrname];
  }
  return res;
}

/**
 * Sets the enabled logging level.
 * All the disabled logging methods are replaced by a noop,
 * so there is not any performance penalty at production using an undesired level
 *
 * @param {String} level
 */
function setLevel(level) {
  currentLevel = level || DEFAULT_LEVEL;
  var logLevelIndex = levels.indexOf(currentLevel.toUpperCase());

  levels.forEach(function(logLevel) {
    var fn;
    if (logLevelIndex <= levels.indexOf(logLevel)) {
      fn = logWrap.bind(global, logLevel);
    } else {
      fn = noop;
    }
    API[logLevel.toLowerCase()] = fn;
  });
}

/**
 * Gets the current log level.
 *
 * @return {String}   One of the following values
 *     ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
 */
function getLevel() {
  return currentLevel || DEFAULT_LEVEL;
}

/**
 * The exported API.
 * The following methods are added dynamically
 * API.debug
 * API.info
 * API.warn
 * API.error
 * API.fatal
 *
 * @type {Object}
 */
module.exports = API = {
  /**
   * The stream where the logger will write string traces
   * Defaults to process.stdout
   */
  stream: process.stdout,

  /**
   * Sets the enabled logging level.
   * All the disabled logging methods are replaced by a noop,
   * so there is not any performance penalty at production using an undesired level
   *
   * @param {String} level one of the following values
   *     ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
   */
  setLevel: setLevel,

  /**
   * Gets the current log level.
   *
   * @return {String}   One of the following values
   *     ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
   */
  getLevel: getLevel,

  /**
   * Gets the context for a determinate trace. By default, this is a noop that
   * you can override if you are managing your execution context with node domains
   *
   * This function must return an object with the following fields
   * {
   *   corr: {String},
   *   trans: {String},
   *   op: {String}
   * }
   *
   * If you are not using domain, you should pass the context information for
   * EVERY log call
   *
   * Both examples will produce the same trace
   *
   * Example usage not using getContext:
   *   var logger = require('logops');
   *   req.context = {
   *    corr: 'cbefb082-3429-4f5c-aafd-26b060d6a9fc',
   *    trans: 'cbefb082-3429-4f5c-aafd-26b060d6a9fc',
   *    op: 'SendEMail'
   *   }
   *   logger.info(req.context, 'This is an example');
   *
   * Example using this feature:
   *    var logger = require('logops'),
   *        domain = require('domain');
   *
   *    logger.getContext = function domainContext() {
   *        return domain.active.myCustomContext;
   *    }
   *    //...
   *
   *    logger.info('This is an example');
   *
   * @return {Object} The context object
   */
  getContext: noop,

  /**
   * Creates a string representation for a trace.
   *
   * It checks the `LOGOPS_FORMAT` environment variable to use the built-in
   * format functions. It fallbacks to check the de-facto `NODE_ENV` env var
   * to use the `formatters.dev` when the value is `development`. Otherwise, it
   * will use the `formatters.pipe` (while in production, for example)
   *
   * Example
   *   NODE_ENV=development node index.js
   * the logger will write traces for developers
   *
   *   node index.js
   * the logger will write traces in a pipe format (assuming NODE_ENV nor
   * LOGOPS_FORMAT environment vars are defined with valid values)
   *
   *   LOGOPS_FORMAT=json node index.js
   * the logger will write json traces
   *
   * You can override this func and manage by yourself the formatting.
   *
   * @param {String} level One of the following values
   *      ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
   * @param {Object} context Additional information to add to the trace
   * @param {String} message The main message to be added to the trace
   * @param {Array} args More arguments provided to the log function
   *
   * @return {String} The trace formatted
   */
  format: formatters[process.env.LOGOPS_FORMAT] ||
    (process.env.NODE_ENV === 'development' ? formatters.dev : formatters.json),

  /**
   * Return an Object containing the available formatters ("dev", "pipe", "json").
   *
   * Example using this feature to write JSON logs.
   *
   * var logger = require('logops');
   * logger.format = logger.formatters.json;
   * logger.info('This is an example')
   *
   * @return {Object} The available formatters.
   */
  formatters: formatters
};

setLevel(process.env.LOGOPS_LEVEL);
