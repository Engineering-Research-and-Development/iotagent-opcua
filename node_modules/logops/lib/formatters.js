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

/*jshint -W072*/
'use strict';

var util = require('util'),
    colors = require('colors/safe'),
    stringify = require('json-stringify-safe'),
    serializeErr = require('serr'),
    omit = require('lodash').omit;

var DEFAULT_NOT_AVAILABLE = 'n/a';

var notAvailable = DEFAULT_NOT_AVAILABLE,
    templateTrace = 'time=%s | lvl=%s | corr=%s | trans=%s | op=%s | msg=';

/**
 * The exported formatters.
 *
 * @type {Object}
 */
var API = module.exports = {
  dev: formatDevTrace,
  json: formatJsonTrace,
  stacktracesWith: ['ERROR', 'FATAL'],
  pipe: formatTrace, // Deprecated
  setNotAvailable: setNotAvailable // Deprecated
};
/**
 * Sets a value for those fields that are not available in the context. This field
 * will only be used in the 'pipes' formatter.
 *
 * @param {String} na New value for not available fields.
 * @deprecated
 */
function setNotAvailable(na) {
  notAvailable = na;
}

/**
 * Formats a trace message with some nice TTY colors
 *
 * @param {String} level One of the following values
 *      ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
 * @param {Object} context Additional information to add to the trace
 * @param {String} message The main message to be added to the trace
 * @param {Array} args More arguments provided to the log function
 * @param {Error|undefined} err A cause error used to log extra information
 *
 * @return {String} The trace formatted
 */
function formatDevTrace(level, context, message, args, err) {
  var str,
      mainMessage = util.format.apply(global, [message].concat(args)),
      printStack = API.stacktracesWith.indexOf(level) > -1;

  switch (level) {
    case 'DEBUG':
      str = colors.grey(level);
      break;
    case 'INFO':
      str = colors.blue(level) + ' '; // Pad to 5 chars
      break;
    case 'WARN':
      str = colors.yellow(level) + ' '; // Pad to 5 chars
      break;
    case 'ERROR':
      str = colors.red(level);
      break;
    case 'FATAL':
      str = colors.red.bold(level);
      break;
  }

  str += ' ' + mainMessage;

  var localContext = omit(context, formatDevTrace.omit);
  str += Object.keys(localContext).length ?
      ' ' + colorize(colors.gray, util.inspect(localContext)) :
      '';

  // Add the error only if we need the stack or the error message is
  // different fom the message one, i.e: logger.info(err, 'Custom Msg')
  if (err && ((mainMessage !== err.name + ': ' + err.message) || printStack)) {
    str += '\n' + colorize(colors.gray, serializeErr(err).toString(printStack));
  }
  // pad all subsequent lines with as much spaces as "DEBUG " or "INFO  " have
  return str.replace(new RegExp('\r?\n','g'), '\n      ');
}
/**
 * Context properties that should be skipped from printing in dev format
 * @type {Array.<String>}
 */
formatDevTrace.omit = [];

// Damm! colors are not applied to multilines! split, apply and join!
function colorize(color, str) {
  return str
      .split('\n')
      .map(function(part) {
        return color(part);
      })
      .join('\n');
}

/**
 * Formats a trace message with fields separated by pipes.
 *
 * DEPRECATED!
 *
 * @param {String} level One of the following values
 *      ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
 * @param {Object} context Additional information to add to the trace
 * @param {String} message The main message to be added to the trace
 * @param {Array} args More arguments provided to the log function
 * @param {Error|undefined} err A cause error used to log extra information
 *
 * @return {String} The trace formatted
 * @deprecated
 */
function formatTrace(level, context, message, args, err) {

  var recontext = {
    time: (new Date()).toISOString(),
    lvl: level,
    corr: context.corr || notAvailable,
    trans: context.trans || notAvailable,
    op: context.op || notAvailable
  };

  Object.keys(context)
      .filter(function(key) {
        return !(context[key] && Object.prototype.toString.call(context[key]) === '[object Function]');
      })
      .forEach(function(key) {
        recontext[key] = context[key] || notAvailable;
      });

  recontext.msg = message;

  var str = Object.keys(recontext)
      .map(function(key) {
        return key + '=' + recontext[key];
      })
      .join(' | ');

  args.unshift(str);
  if (err && message !== '' + err) {
    args.push(err);
  }

  return util.format.apply(global, args);
}

/**
 * Formats a trace message in JSON format
 *
 * @param {String} level One of the following values
 *      ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
 * @param {Object} context Additional information to add to the trace
 * @param {String} message The main message to be added to the trace
 * @param {Array} args More arguments provided to the log function
 * @param {Error|null} err A cause error used to log extra information
 *
 * @return {String} The trace formatted
 */
function formatJsonTrace(level, context, message, args, err) {
  return formatJsonTrace.stringify(formatJsonTrace.toObject(level, context, message, args, err));
}

formatJsonTrace.stringify = stringify;
formatJsonTrace.toObject = function toObject(level, context, message, args, err) {
  var log = {},
      printStack = API.stacktracesWith.indexOf(level) > -1;

  for (var attrname in context) {
    log[attrname] = context[attrname];
  }

  log.time = new Date();
  log.lvl = level;
  log.err = err && serializeErr(err).toObject(printStack);
  log.msg = util.format.apply(global, [message].concat(args));

  return log;
};
