// Example to interact with in https://tonicdev.com/npm/serr

var serializeError = require('serr');

var error = new Error('User Not Found');
error.statusCode = 404;

console.log(serializeError(error).toObject());

// ADD stack traces
console.log(serializeError(error).toString(true));
