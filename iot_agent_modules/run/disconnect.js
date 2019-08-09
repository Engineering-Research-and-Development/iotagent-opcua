module.exports = {
    disconnect: function(the_session, client) {
        console.log(' Closing session');
        the_session.close(function(err) {
            console.log(' session closed', err);
        });
        console.log(' Calling disconnect');
        client.disconnect(function(err) {
            console.log(' disconnected', err);
        });
    }
};
