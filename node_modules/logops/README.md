# logops

Really simple and performant JSON logger for node.js.

[![npm version](https://img.shields.io/npm/v/logops.svg)](http://badge.fury.io/js/logops)
[![Build Status](https://img.shields.io/travis/telefonicaid/logops.svg)](https://travis-ci.org/telefonicaid/logops)
[![Coveralls branch](https://img.shields.io/coveralls/telefonicaid/logops/master.svg)](https://coveralls.io/r/telefonicaid/logops?branch=master)
[![Dependency Status](https://img.shields.io/gemnasium/telefonicaid/logops.svg)](https://gemnasium.com/telefonicaid/logops)

## Installation

```bash
npm install logops
```

## Basic usage

```js
var logger = require('logops');

//plain strings
logger.debug('This is an example');
// {"time":"2015-12-22T16:31:39.220Z","lvl":"DEBUG","msg":"This is an example"}

//util.format support
logger.info('Request %s %d %j', 'is', 5, {key: 'value'}, 'guy');
// {"time":"2015-12-22T16:31:56.184Z","lvl":"INFO","msg":"Request is 5 {\"key\":\"value\"} guy"}

//properties in the log trace
logger.warn({ip: '127.0.0.0'}, 'Something went wrong');
// {"ip":"127.0.0.0","time":"2015-12-22T16:33:17.002Z","lvl":"WARN","msg":"Something went wrong"}

//special case: error instance to print error info (and stack traces)...
logger.error(new TypeError('String required'));
/* {"time":"2015-12-22T16:36:39.650Z","lvl":"ERROR",
 *  "err":{"message":"String required","name":"TypeError","constructor":"TypeError","stack":"TypeError: String required\n    at...",
 *  "msg":"TypeError: String required"} */

//... or specify the message
logger.fatal(new Error('Out of memory'), 'SYSTEM UNSTABLE. BYE');
/* {"time":"2015-12-22T16:45:36.468Z","lvl":"FATAL",
 *  "err":{"message":"Out of memory","name":"Error","constructor":"Error","stack":"Error: Out of memory\n    at...",
 *  "msg":"SYSTEM UNSTABLE. BYE"} */
```

* If you give an object as the first argument, you will print its properties but not a String representation of it. `logger.info(req)` will set all `req` properties in the final json. `logger.info({a:'guy'}) =>
{"a":"guy","time":"2015-12-23T12:09:12.610Z","lvl":"INFO","msg":"undefined"}`

* The pattern `logger.error(err)` is very common. This API embraces the requirenment, and makes an special management of it. But getting an error stack trace is not cheap. It only will be get and printed when `log.error` or `log.fatal` is used, so you can use `logger.info(new Error('User Not Found'));` to not print useless stackstraces for your bussiness logic errors. _You can override it, btw_

* With the rest of arguments is just like calling `console.log`. It will be serialized as the trace message. Easy to remember.

## Context support

Logops supports using global properties that will be merged with the specific ones defined in the call. Simply override the `logger.getContext` method to let the logger to get it.

```js
var logger = require('logops'),
    hostname = require('os').hostname();

logger.getContext = function getContext() {
  return {
    hostname: hostname,
    pid: process.pid
  };
}

logger.info({app: 'server'}, 'Startup');
// {"hostname":"host.local","pid":35502,"app":"server","time":"2015-12-23T11:47:25.862Z","lvl":"INFO","msg":"Startup"}
```

## Logger Level

You can set the logging level at any time. All the disabled logging methods are replaced by a noop,
so there is not any performance penalty at production using an undesired level

```js
var logger = require('logops');

// {String} level one of the following values ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
logger.setLevel('DEBUG');
```

You can also set the logging level using the `LOGOPS_LEVEL` environment variable:

```bash
export LOGOPS_LEVEL=DEBUG
```

You can get the logging level using the `getLevel()` function of the logger:
```
currentLevel = logger.getLevel();
```

## Trace format

This library incorporates two flavors of trace formatting:
* "json": writes logs as JSON. This is the **DEFAULT in v1.0.0**
* "dev": for development. Used with 'de-facto' NODE_ENV variable is set to 'development'
* "pipe": writes logs separating fields with pipes. **DEPRECATED in v1.0.0** 

```js
logger.format = logger.formatters.json;
logger.info({key:'value'}, 'This is an example: %d', 5);
// {"key":"value","time":"2015-12-23T11:55:27.041Z","lvl":"INFO","msg":"This is an example: 5"}

logger.format = logger.formatters.dev;
logger.info({key:'value'}, 'This is an example: %d', 5);
// INFO  This is an example: 5 { key: 'value' }

logger.format = logger.formatters.pipe; //DEPRECATED in v1.0.0
logger.info({key:'value'}, 'This is an example: %d', 5);
// time=2015-12-23T11:57:24.879Z | lvl=INFO | corr=n/a | trans=n/a | op=n/a | msg=This is an example: 5
```

You can also set the format specifying the formatter with `LOGOPS_FORMAT` environment variable:

```bash
export LOGOPS_FORMAT=json
# export LOGOPS_FORMAT=dev
```

## Advanced Usage

### Trace format

You can override the format function and manage by yourself the formatting taking into account your own environment variables by
overriding the `logger.format` function

### Don't print specific properties with `dev` format 

Omit some boring/repeated/always-the-same context properties from being logged with the `dev` formatter:

```js
logger.format = logger.formatters.dev;
logger.getContext = () => ({ pid: process.pid });
logger.info({key:'value', ip:'127.0.0.1'}, 'This is an example: %d', 5);
// INFO  This is an example: 5 { pid: 123342, key: 'value', ip: '127.0.0.1' }

// Specify the context fields to omit as an array
logger.formatters.dev.omit = ['pid', 'ip'];

logger.info({key:'value', ip:'127.0.0.1'}, 'This is an example: %d', 5);
// INFO  This is an example: 5 { key: 'value' }
```

### Don't print Error Stack traces

Set `logger.formatters.stacktracesWith` array with the error levels that will print stacktraces. Default is `stacktracesWith: ['ERROR', 'FATAL']`

### Writing to files

This library writes by default to `process.stdout`, the safest, fastest and easy way to manage logs. It's how you execute your app when you define how to manage logs.

This approach is also compatible with [logrotate](http://linuxcommand.org/man_pages/logrotate8.html) as this is how many servers and PaaS manage the logs.
Therefore you don't need to put __anything__ in your source code relative to logs, and all is done at execution time depending on the deployment.

__Recommended execution:__ Pipelining the stdout to [tee](http://en.wikipedia.org/wiki/Tee_(command)).
With this configuration, you will not fail when the disk is full

```bash
# write all traces to out.log
set -o pipefail
node index.js | tee -a out.log > /dev/null
```

```bash
# write error and fatal traces to error.log and all traces to out.log (using json formatter)
set -o pipefail
LOGOPS_FORMAT=json node index.js | tee >(grep -a -F -e '"lvl":"ERROR"' -e '"lvl":"FATAL"' > error.log) > out.log
```

You can also write logs and fail miserably stopping your app when the disk is full by doing

```bash
node index.js > out.log
```

Please read carefully in the node documentation how the `stdout`/`stderr` stream behaves [regarding synchronous/asynchronous writing](https://nodejs.org/api/process.html#process_process_stdout)

If you want to pipe the output stream to any other stream in your source code, or even write to files *(not recommended)*,
you can override the stream used by this library

```js
var logger = require('logops');
logger.stream = new MyOtherSuperStreamThatDoesGreatThingsExceptWriteToDisk();
```

## History
This project was created initially for logging using the now deprecated pipe format, used internally at Telefonica by some logging infrastructure deployments.
Now we are switching to a new one one, based on documents and a NoSQL infrastructure, where the JSON format is the one that 
fits best. We got inspired by the wonderful [`bunyan`](https://github.com/trentm/node-bunyan) project and made some little adjustments in our API
to be compliant with it, to reduce developer learning curve, make our preexisting code compatible and keep (or even improve) [its great performance](https://www.loggly.com/blog/a-benchmark-of-five-node-js-logging-libraries/).
  

## Benchmark
A very basic [benchmark](./benchmark/index.js) with the most common use case has 
been setup to compare with [`bunyan`](https://github.com/trentm/node-bunyan)

Running on a MAC OS X Yosemite, 2,5 GHz Intel Core i5, 8 GB 1333 MHz DDR3, SSD disk, node 4.2.2
 
```
$ cd benchmark; npm start
               
> benchmarklogops@1.0.0 start /Users/javier/Documents/Proyectos/logops/benchmark
> npm run tee && npm run file && npm run null && rm out.log


> benchmarklogops@1.0.0 tee /Users/javier/Documents/Proyectos/logops/benchmark
> node index.js | tee -a out.log > /dev/null

logops x 39,560 ops/sec ±3.00% (75 runs sampled)
bunyan x 27,365 ops/sec ±2.23% (79 runs sampled)
Basic logging: Fastest is logops
logops x 73,150,310 ops/sec ±1.64% (79 runs sampled)
bunyan x 1,569,549 ops/sec ±3.67% (78 runs sampled)
Disabled logging: Fastest is logops

> benchmarklogops@1.0.0 file /Users/javier/Documents/Proyectos/logops/benchmark
> node index.js > out.log

logops x 43,136 ops/sec ±1.31% (82 runs sampled)
bunyan x 28,653 ops/sec ±1.05% (84 runs sampled)
Basic logging: Fastest is logops
logops x 80,439,813 ops/sec ±1.17% (85 runs sampled)
bunyan x 1,645,447 ops/sec ±1.66% (85 runs sampled)
Disabled logging: Fastest is logops

> benchmarklogops@1.0.0 null /Users/javier/Documents/Proyectos/logops/benchmark
> node index.js > /dev/null

logops x 52,947 ops/sec ±1.80% (80 runs sampled)
bunyan x 33,696 ops/sec ±0.96% (84 runs sampled)
Basic logging: Fastest is logops
logops x 77,479,942 ops/sec ±1.47% (79 runs sampled)
bunyan x 1,411,108 ops/sec ±1.92% (85 runs sampled)
Disabled logging: Fastest is logops
```

## License

Copyright 2014, 2015 [Telefonica Investigación y Desarrollo, S.A.U](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
