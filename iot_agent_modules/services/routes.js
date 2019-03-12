module.exports = function(app) {
    // Insert routes below
    app.use('/status', require('./status'));
    app.use('/commandsList', require('./commandsList'));
    app.use('/json', require('./config_json'));
    app.use('/version', require('./version'));
    app.use('/config', require('./config'));
};
