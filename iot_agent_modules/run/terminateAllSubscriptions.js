module.exports = {
    terminateAllSubscriptions: function(the_subscriptions) {
        if (the_subscriptions) {
            the_subscriptions.forEach(function(subscription) {
                console.log('terminating subscription: ', subscription.subscriptionId);
                subscription.terminate();
            });
        }
    }
};
