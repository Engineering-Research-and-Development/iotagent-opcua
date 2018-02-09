/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of iotagent-lwm2m-lib
 *
 * iotagent-lwm2m-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-lwm2m-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-lwm2m-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */
'use strict';

var readline = require('readline'),
    writer = console,
    async = require('async'),
    fs = require('fs'),
    stressTest = false,
    toExit = false,
    stressBatch = [],
    internalCommands = {
        'stressInit': {
            parameters: [],
            description: '\tStart recording a stress batch.',
            handler: function() {}
        },
        'stressCommit': {
            parameters: ['delay', 'times', 'threads', 'initTime'],
            description: '\tExecutes the recorded batch as many times as requested, with delay (ms) ' +
                                'between commands. \n' +
                         '\tThe "threads" parameter indicates how many agents will repeat that same sequence. ' +
                                'The "initTime" (ms)\n' +
                         '\tparameter indicates the mean of the random initial waiting times for each agent.',
            handler: function() {}
        },
        'exit': {
            parameters: [],
            description: '\tExit from the command line.',
            handler: function() {}
        }
    },
    rl;

/**
 * Shows the information of an error in the console.
 *
 * @param {Object} error            Standard error object
 */
function handleError(error) {
    writer.log('\nError:\n--------------------------------\nCode: %s\nMessage: %s\n\n', error.name, error.message);
    rl.prompt();
}

function end() {
    rl.close();
    process.stdin.destroy();
}

/**
 * Shows the command help created from the commands object.
 *
 * @param {Object} commands         Object containing all the commands available for the interpreter
 */
function showHelp(commands) {
    var keyList = Object.keys(commands),
        internalKeys = Object.keys(internalCommands),
        i, j, parameters;

    writer.log('\n');

    for (i = 0; i < internalKeys.length; i++) {
        parameters = '';

        for (j = 0; j < internalCommands[internalKeys[i]].parameters.length; j++) {
            parameters += '<' + internalCommands[internalKeys[i]].parameters[j] + '> ';
        }

        writer.log('%s %s \n\n%s\n', internalKeys[i], parameters, internalCommands[internalKeys[i]].description);
    }

    for (i = 0; i < keyList.length; i++) {
        parameters = '';

        for (j = 0; j < commands[keyList[i]].parameters.length; j++) {
            parameters += '<' + commands[keyList[i]].parameters[j] + '> ';
        }

        writer.log('%s %s \n\n%s\n', keyList[i], parameters, commands[keyList[i]].description);
    }
}

/**
 * Initiates a Stress Test batch.
 */
function stressInit() {
    writer.log('Stress batch recording\n');
    stressTest = true;
    stressBatch = [];
}

/**
 * Checks that a command is valid and executes it based on the commands array given.
 *
 * @param {Array} command       Array with the command name and parameters.
 * @param {Array} commands      Array of commands to interpret the given one.
 */
function execute(command, commands) {
    if (command.length - 1 !== commands[command[0]].parameters.length) {
        writer.log('Wrong number of parameters. Expected: %s', JSON.stringify(commands[command[0]].parameters));
    } else {
        commands[command[0]].handler(command.slice(1));
    }
}

/**
 * Executes the current stress test batch.
 *
 * @param {Array} command       Array with the command name and parameters.
 * @param {Array} commands      Array of commands to interpret the given one.
 */
function stressCommit(command, commands) {
    var delay = command[1],
        times = parseInt(command[2], 10),
        threads = parseInt(command[3], 10),
        initTime = parseInt(command[4], 10),
        executionBatch = [];

    function executeCommandFn(value) {
        return function(callback) {
            writer.log('Exec: ', JSON.stringify(value));
            execute(value, commands);
            callback();
        };
    }

    function delayFn(value) {
        return function(callback) {
            var localValue = value * 2 * Math.random();

            setTimeout(function() {
                callback();
            }, localValue);
        };
    }

    function addDelays(previous, current) {
        previous.push(executeCommandFn(current));
        previous.push(delayFn(delay));
        return previous;
    }

    function executeBatch(index, callback) {
        async.times(times, function(i, innerCallback) {
            async.series(executionBatch, innerCallback);
        }, callback);
    }

    executionBatch.push(delayFn(initTime));
    executionBatch = executionBatch.concat(stressBatch.reduce(addDelays, []));

    async.times(threads, executeBatch, function() {
        writer.log('Stress execution finished\n');
        stressTest = false;

        if (toExit) {
            end();
        }
    });
}

/**
 * Adds a new command to the stress test batch.
 *
 * @param {Array} command       Array with the command name and parameters.
 */
function stressAdd(command) {
    writer.log('Command added to stress batch\n');
    stressBatch.push(command);
}

function doExit() {
    if (!stressTest) {
        end();
    } else {
        toExit = true;
    }
}
/**
 * Executes the given command (the list of words parsed from the command line input) in the context of the commands
 * describe by the object Commands.
 *
 * @param {Object} command          List of strings parsed from the user input
 * @param {Object} commands         Object containing all the commands available for the interpreter
 */
function executeCommander(command, commands) {
    if (command[0] === 'help') {
        showHelp(commands);
    } else if (command[0] === 'exit') {
        doExit();
    } else if (command[0] === 'stressInit') {
        stressInit();
    } else if (command[0] === 'stressCommit') {
        stressCommit(command, commands);
    } else if (stressTest) {
        stressAdd(command);
    } else if (commands[command[0]]) {
        execute(command, commands);
    } else if (command[0] === '') {
        writer.log('\n');
    } else {
        writer.log('Unrecognized command');
    }
    rl.prompt();
}

/**
 * Creates a function that shows the selected branch (attribute) of the config, formatted with the correct indentation.
 *
 * @param {Object} config           Configuration object
 * @param {String} branch           Branch (attribute) of the configuration object to display
 * @return {Function}               Function that displays the selected branch of the configuration.
 */
function showConfig(config, branch) {
    return function () {
        writer.log('\nConfig:\n--------------------------------\n\n%s', JSON.stringify(config[branch], null, 4));
    };
}

function removeQuotes(item) {
    return item.replace(/"/g, '');
}

function prompt() {
    if (!stressTest) {
        rl.prompt();
    }
}

/**
 * Initialize the command line client with the given commands and prompt. Each command has the following structure:
 *
 *     'create': {
 *      parameters: ['objectUri'],
 *      description: '\tCreate a new object. The object is specified using the /type/id OMA notation.',
 *      handler: create
 *  }
 *
 * where: the parameters attribute is a list of the needed parameters for the command (if its invoked with a different
 * number of parameters an error will be raised); the description attribute contains the contents that will be shown
 * in the command help; and the handler is the function that will be called when the command is executed.
 *
 * @param {Object} commands         Object containing all the commands of the interpreter indexed by name.
 * @param {String} promptString           Prompt string to shoe in each line
 */
function initialize(commands, promptString) {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', function (cmd) {
        var groups = cmd.match(/(?:[^\s"]+|"[^"]*")+/g);

        if (groups) {
            executeCommander(groups.map(removeQuotes) || [''], commands);
        } else {
            prompt();
        }
    });
    if (process.argv.length === 3) {
        var lines = fs.readFileSync(process.argv[2], 'utf8').split('\n');

        for (var i in lines) {
            if (lines[i]) {
                rl.write(lines[i] + '\n');
            }
        }
    }

    rl.setPrompt(promptString);
    rl.prompt();
}

function destroy() {
    rl.close();
}

function printName(name) {
    return function () {
        writer.log('Executing: %s', name);
        rl.prompt();
    };
}

function notImplemented() {
    writer.log('This feature has not been fully implemented yet.');
    rl.prompt();
}

function setWriter(newWriter) {
    writer = newWriter;
}

function getWriter() {
    return writer;
}

exports.prompt = prompt;
exports.showHelp = showHelp;
exports.executeCommander = executeCommander;
exports.showConfig = showConfig;
exports.initialize = initialize;
exports.destroy = destroy;
exports.printName = printName;
exports.notImplemented = notImplemented;
exports.handleError = handleError;
exports.setWriter = setWriter;
exports.getWriter = getWriter;
