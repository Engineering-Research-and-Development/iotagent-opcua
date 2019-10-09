module.exports = {
    run: function() {
        require('requirish')._(module);

        var alarms = require('../../node_modules/iotagent-node-lib/lib/services/common/alarmManagement');
        var constants = require('../../node_modules/iotagent-node-lib/lib/constants');

        var treeify = require('treeify');
        var _ = require('underscore');
        var util = require('util');
        var async = require('async');
        var opcua = require('node-opcua');
        var NodeCrawler = opcua.NodeCrawler;
        // iotagent-node-lib dependencies
        var iotAgentLib = require('iotagent-node-lib');
        var userIdentity = null; // anonymous
        var request = require('request');
        var cfc = require('./../cleanForbiddenCharacters');
        var mG = require('./mongoGroup');
        var rSfN = require('./removeSuffixFromName');
        var tAs = require('./terminateAllSubscriptions');
        var disconnect = require('./disconnect');
        var cM = require('./callMethods');
        var fT = require('./findType');
        var cR = require('./createResponse');
        var eUv = require('./executeUpdateValues');
        var groupService = require('../../node_modules/iotagent-node-lib/lib/services/groups/groupService');
        var commonConfig = require('../../node_modules/iotagent-node-lib/lib/commonConfig');
        var deviceService = require('../../node_modules/iotagent-node-lib/lib/services/devices/deviceService');
        var fs = require('fs');

        var argv = require('yargs')
            .wrap(132)

            .string('timeout')
            .describe('timeout', ' the timeout of the session in second =>  (-1 for infinity)')

            .string('debug')
            .describe('debug', ' display more verbose information')

            .string('browse')
            .describe(
                'browse',
                ' browse Objects from opc-ua server. Fulfill browseServerOptions section in config file'
            )

            .alias('t', 'timeout')
            .alias('d', 'debug')
            .alias('b', 'browse').argv;

        var logger = require('logops');
        logger.format = logger.formatters.pipe;

        // Specify the context fields to omit as an array
        // var PropertiesReader = require('properties-reader');
        // var properties = PropertiesReader('./conf/config.properties');
        // fully qualified name
        var endpointUrl = properties.get('endpoint');
        var securityMode = properties.get('securityMode');
        var securityPolicy = properties.get('securityPolicy');
        var userName = properties.get('userName');
        var password = properties.get('password');
        var polling_commands_timer = properties.get('polling-commands-timer');
        var polling_up = properties.get('polling');

        var checkTimer = properties.get('checkTimer');

        var _setInterval = require('setinterval-plus');

        if (fs.existsSync('./conf/config.json')) {
            var config = JSON.parse(fs.readFileSync('./conf/config.json', 'utf8'));
        } else {
            doAuto = true;
        }

        logContext.op = 'Index.Initialize';
        logger.info(logContext, '----------------------------------------------------');

        // NODE1
        // var sMode = opcua.MessageSecurityMode.get(securityMode || 'NONE');
        // if (!sMode) {
        //    throw new Error('Invalid Security mode , should be ' + opcua.MessageSecurityMode.enums.join(' '));
        // }

        securityMode = 1;
        securityPolicy = opcua.SecurityPolicy['None'];

        if (securityMode === opcua.MessageSecurityMode.Invalid) {
            throw new Error('Invalid Security mode,  should be ' + opcua.MessageSecurityMode.enums.join(' '));
        }

        if (securityPolicy === opcua.SecurityPolicy.Invalid) {
            throw new Error('Invalid securityPolicy should be ' + opcua.SecurityPolicy.enums.join(' '));
        }

        // NODE1
        // var sPolicy = opcua.SecurityPolicy.get(securityPolicy || 'None');
        // if (!sPolicy) {
        //    throw new Error('Invalid securityPolicy , should be ' + opcua.SecurityPolicy.enums.join(' '));
        // }

        var timeout = parseInt(argv.timeout) * 1000 || -1; // 604800*1000; //default 20000
        var doBrowse = !!argv.browse;

        logger.info(logContext, 'endpointUrl         = '.cyan, endpointUrl);
        logger.info(logContext, 'securityMode        = '.cyan, securityMode.toString());
        logger.info(logContext, 'securityPolicy      = '.cyan, securityPolicy.toString());
        logger.info(logContext, 'timeout             = '.cyan, timeout || ' Infinity ');
        // set to false to disable address space crawling: might slow things down if the AS is huge
        var doCrawling = !!argv.crawl;
        var client = null;
        var the_session = null;
        global.the_subscriptions = [];
        var contexts = [];

        // Getting contextSubscriptions configuration
        var contextSubscriptions = config.contextSubscriptions;

        var methods = [];
        var devicesSubs = [];
        var devices = [];

        /*
        // Load persisted devices to monitor
        function loadDevices() {
            iotAgentLib.listDevices(function(error, results) {
                results.devices.forEach(function(device) {
                    console.log('@@@ LOAD DEVICES');

                    if (device.protocol != 'OPCUA') {
                        return;
                    }
                    devicesSubs[device.id] = [];
                    devices[device.id] = device;

                    iotAgentLib.updateRegister(device, function(err) {
                        var newDevice = {};
                        if (config.contextBroker.ngsiVersion == undefined) {
                            createInitialEntityNgsi1(device, newDevice, function(error, results) {});
                        } else {
                            if (config.contextBroker.ngsiVersion == 'v2') {
                                createInitialEntityNgsi2(device, newDevice, function(error, results) {});
                            } else {
                                createInitialEntityNgsi1(device, newDevice, function(error, results) {});
                            }
                        }
                        if (err) {
                            // skip context
                            logger.error(logContext, 'could not register OCB context ' + device.id + '');
                            // NODE1
                            // logger.info(logContext, JSON.stringify(err).red.bold);
                            logger.info(logContext, JSON.stringify(err));
                        } else {
                            // init subscriptions
                            logger.info(logContext, 'registered successfully OCB context ' + device.id);
                        }
                    });

                    activeDeviceSubs(device);
                });
            });
        }
		*/

        /*
         * Initializes a subscription to OPCUA server and
         * notifies every change in the variable value to OCB
         */
        function initSubscriptionBroker(context, mapping) {
            logContext.op = 'Index.InitSubscriptions';
            // TODO this stuff too should come from config
            var parameters = {
                requestedPublishingInterval: properties.get('requestedPublishingInterval'),
                requestedLifetimeCount: properties.get('requestedLifetimeCount'),
                requestedMaxKeepAliveCount: properties.get('requestedMaxKeepAliveCount'),
                maxNotificationsPerPublish: properties.get('maxNotificationsPerPublish'),
                publishingEnabled: properties.get('publishingEnabled'),
                priority: properties.get('priority')
            };

            // Creating a subscription to OPCUA Server
            // NODE1
            // var subscription = new opcua.ClientSubscription(the_session, parameters);
            var subscription = opcua.ClientSubscription.create(the_session, parameters);

            function getTick() {
                return Date.now();
            }

            var t = getTick();

            subscription
                .on('started', function() {
                    logger.info(logContext, 'started subscription: ', subscription.subscriptionId);
                    logger.info(logContext, ' revised parameters ');
                    logger.info(
                        logContext,
                        '  revised maxKeepAliveCount  ',
                        subscription.maxKeepAliveCount,
                        ' ( requested ',
                        parameters.requestedMaxKeepAliveCount + ')'
                    );
                    logger.info(
                        logContext,
                        '  revised lifetimeCount      ',
                        subscription.lifetimeCount,
                        ' ( requested ',
                        parameters.requestedLifetimeCount + ')'
                    );
                    logger.info(
                        logContext,
                        '  revised publishingInterval ',
                        subscription.publishingInterval,
                        ' ( requested ',
                        parameters.requestedPublishingInterval + ')'
                    );
                    // NODE1
                    // logger.info(logContext, '  suggested timeout hint     ', subscription.publish_engine.timeoutHint);
                    logger.info(logContext, '  suggested timeout hint     ', subscription.publishEngine.timeoutHint);
                })
                .on('internal_error', function(err) {
                    logger.error(logContext, 'received internal error');
                    logger.info(JSON.stringify(err));
                })
                .on('keepalive', function() {
                    logContext.op = 'Index.keepaliveSubscriptionBroker';
                    var t1 = getTick();
                    var span = t1 - t;
                    t = t1;
                    var keepAliveString =
                        'keepalive ' +
                        span / 1000 +
                        ' ' +
                        'sec' +
                        ' pending request on server = ' +
                        // NODE1
                        // subscription.publish_engine.nbPendingPublishRequests +
                        subscription.publishEngine.nbPendingPublishRequests +
                        '';
                    logger.debug(logContext, keepAliveString.gray);

                    /*
					iotAgentLib.retrieveDevice(context.id, null, function(error, device) {
						if(error){
							subscription.terminate();
						};
						*
						if (device.active.length==0){
							subscription.terminate();
						}
					}); */
                })
                .on('terminated', function(err) {
                    if (err) {
                        logger.error(
                            logContext,
                            'could not terminate subscription: ' + subscription.subscriptionId + ''
                        );
                        logger.info(logContext, JSON.stringify(err));
                    } else {
                        logger.info(logContext, 'successfully terminated subscription: ' + subscription.subscriptionId);
                    }
                });

            the_subscriptions.push(subscription);

            logger.info(logContext, 'initializing monitoring: ' + mapping.opcua_id);

            subscription.monitor(
                {
                    nodeId: mapping.opcua_id,
                    attributeId: opcua.AttributeIds.Value
                },
                // TODO some of this stuff (samplingInterval for sure) should come from config
                // TODO All these attributes are optional remove ?
                {
                    // clientHandle: 13, // TODO need to understand the meaning this! we probably cannot reuse the same handle everywhere
                    samplingInterval: properties.get('samplingInterval'),
                    queueSize: properties.get('queueSize'),
                    discardOldest: properties.get('discardOldest')
                },
                // NODE1
                // opcua.read_service.TimestampsToReturn.Both
                opcua.TimestampsToReturn.Both,
                function(err, monItem) {
                    if (err) {
                        logger.error(
                            logContext,
                            'An error occured while creating subscription for opcua_id = ' + mapping.opcua_id
                        );
                        return;
                    }

                    // TODO. initialized seems to be not working on the latest OPCUA 2.1.5. Is possible move it in !err code block?
                    monItem.on('initialized', function() {
                        logger.info(logContext, 'started monitoring: ' + monItem.itemToMonitor.nodeId.toString());

                        // Collect all monitoring
                        if (devicesSubs[context.id] == undefined) {
                            devicesSubs[context.id] = [];
                        }

                        devicesSubs[context.id].push(subscription);
                    });

                    monItem.on('changed', function(dataValue) {
                        logContext.op = 'Index.Monitoring';

                        // TODO: Be aware that with the new version you have to change something here
                        var variableValue = null;
                        if (dataValue.value && dataValue.value != null) {
                            variableValue = dataValue.value.value || null;
                            if (dataValue.value.value == 0 || dataValue.value.value == false) {
                                variableValue = dataValue.value.value;
                            }
                        }

                        variableValue = cfc.cleanForbiddenCharacters(variableValue);
                        if (variableValue == null) {
                            logger.debug('ON CHANGED DO NOTHING');
                        } else {
                            logger.info(
                                logContext,
                                monItem.itemToMonitor.nodeId.toString(),
                                ' value has changed to ' + variableValue + ''
                            );

                            // Notifying OPCUA variable change to OCB
                            iotAgentLib.getDevice(context.id, context.service, context.subservice, function(
                                err,
                                device
                            ) {
                                if (err) {
                                    logger.error(logContext, 'could not find the OCB context ' + context.id + '');
                                    logger.info(logContext, JSON.stringify(err));
                                } else {
                                    /* WARNING attributes must be an ARRAY */
                                    var attributes = [
                                        {
                                            name: mapping.ocb_id,
                                            type: mapping.type || fT.findType(mapping.ocb_id, device),
                                            value: variableValue
                                        }
                                    ];

                                    // Setting ID withoput prefix NAME now
                                    // iotAgentLib.update(device.id, device.type, '', attributes, device, function(err) {
                                    iotAgentLib.update(device.name, device.type, '', attributes, device, function(err) {
                                        if (err) {
                                            logger.error(
                                                logContext,
                                                'error updating ' +
                                                    mapping.ocb_id +
                                                    ' on ' +
                                                    device.name +
                                                    ' value=' +
                                                    variableValue +
                                                    ''
                                            );

                                            logger.info(logContext, JSON.stringify(err));
                                        } else {
                                            logger.info(
                                                logContext,
                                                'successfully updated ' +
                                                    mapping.ocb_id +
                                                    ' on ' +
                                                    device.name +
                                                    ' value=' +
                                                    variableValue
                                            );
                                        }
                                    });
                                }
                            });
                        }
                    });

                    monItem.on('err', function(err_message) {
                        logger.error(monItem.itemToMonitor.nodeId.toString(), ' ERROR'.red, err_message);
                    });
                }
            );
        }

        function notificationHandler(device, updates, callback) {
            logger.info(logContext, 'Data coming from OCB: ', JSON.stringify(updates));
            cM.callMethods(updates[0].value, methods, the_session); // TODO gestire multiple chiamate
        }
        // each of the following steps is executed in due order
        // each step MUST call callback() when done in order for the step sequence to proceed further
        async.series(
            [
                // ------------------------------------------
                // initialize client connection to the OCB
                function(callback) {
                    // This also creates the device registry
                    iotAgentLib.activate(config, function(err) {
                        if (err) {
                            logger.error(logContext, 'There was an error activating the Agent: ' + err.message);
                            rSfN.removeSuffixFromName.exit(1);
                        } else {
                            logger.info(logContext, 'NotificationHandler attached to ContextBroker');
                            iotAgentLib.setNotificationHandler(notificationHandler);
                        }
                        callback();
                    });
                },

                // ------------------------------------------
                // initialize client connection to the OPCUA Server
                function(callback) {
                    // const certificateFile = './certificates/client_certificate.pem';
                    // const privateKeyFile = './certificates/PKI/own/private/private_key.pem';

                    var options = {
                        endpoint_must_exist: false,
                        securityMode: securityMode,
                        securityPolicy: securityPolicy,
                        defaultSecureTokenLifetime: 400000,
                        keepSessionAlive: true,
                        requestedSessionTimeout: 100000, // very long 100 seconds
                        connectionStrategy: {
                            maxRetry: 10,
                            initialDelay: 2000,
                            maxDelay: 10 * 1000
                        }
                        // certificateFile: certificateFile,
                        // privateKeyFile: privateKeyFile
                    };

                    logger.info(
                        logContext,
                        'Options = ',
                        options.securityMode.toString(),
                        options.securityPolicy.toString()
                    );

                    // OPCUA-IoTAgent acts as OPCUA Client
                    // NODE1
                    // client = new opcua.OPCUAClient(options);
                    client = opcua.OPCUAClient.create(options);

                    // NODE1
                    // logger.info(logContext, ' connecting to ', endpointUrl.cyan.bold);
                    logger.info(logContext, ' connecting to '.cyan, endpointUrl);

                    client.connect(endpointUrl, callback);

                    client.on('connection_reestablished', function() {
                        logger.info(
                            logContext,
                            ' !!!!!!!!!!!!!!!!!!!!!!!!  CONNECTION RESTABLISHED !!!!!!!!!!!!!!!!!!!'
                        );
                    });

                    client.on('after_reconnection', function(err) {
                        logger.info(logContext, ' ... reconnection process has been completed: ', err);
                    });

                    client.on('close', function(err) {
                        logger.info(logContext, ' Check Security Settings ', err);
                    });

                    client.on('backoff', function(nb, delay) {
                        logger.info(
                            logContext,
                            '  connection failed for the',
                            nb,
                            ' time ... We will retry in ',
                            delay,
                            ' ms'
                        );
                    });

                    client.on('start_reconnection', function() {
                        logger.info(logContext, 'start_reconnection not working so aborting');
                    });
                },

                // ------------------------------------------
                // initialize client session on the OPCUA Server
                function(callback) {
                    userIdentity = null; // anonymous
                    if (userName && password) {
                        userIdentity = {
                            userName: userName,
                            password: password
                        };
                    }
                    client.createSession(userIdentity, function(err, session) {
                        if (!err) {
                            the_session = session;
                            // NODE1
                            // logger.info(logContext, ' session created'.yellow);
                            logger.info(logContext, ' session created');
                            logger.info(logContext, ' sessionId : ', session.sessionId.toString());
                            logger.info(logContext, ' the timeout value set by the server is ', session.timeout, ' ms');
                        }
                        callback(err);
                    });
                },

                function(callback) {
                    contexts = config.contexts;
                    callback();
                },

                // ----------------------------------------
                // display OPCUA namespace array
                function(callback) {
                    var server_NamespaceArray_Id = opcua.makeNodeId(opcua.VariableIds.Server_NamespaceArray); // ns=0;i=2006
                    the_session.readVariableValue(server_NamespaceArray_Id, function(err, dataValue, diagnosticsInfo) {
                        logger.info(logContext, ' --- NAMESPACE ARRAY ---');
                        if (!err) {
                            var namespaceArray = dataValue.value.value;
                            for (var i = 0; i < namespaceArray.length; i++) {
                                logger.info(logContext, ' Namespace ', i, '  : ', namespaceArray[i]);
                            }
                        }
                        logger.info(logContext, ' -----------------------');
                        callback(err);
                    });
                },

                // ------------------------------------------
                // initialize all subscriptions
                function(callback) {
                    // Creating group always

                    if (config.deviceRegistry.type == 'mongodb') {
                        mG.mongoGroup(config);
                        request(optionsCreation, function(error, response, body) {
                            if (error) {
                                logger.error(logContext, 'CREATION GROUP ERROR. Verify OCB connection.');
                            } else {
                                logger.info(logContext, 'GROUPS SUCCESSFULLY CREATED!');
                            }
                        });
                    }

                    // loading services
                    //loadDevices();

                    contexts.forEach(function(context) {
                        logger.info(logContext, 'registering OCB context ' + context.id + ' of type ' + context.type);
                        logContext.srv = context.service;
                        logContext.subsrv = context.subservice;

                        // TODO: as some lazy attributes are loaded, the IotAgent works and the registrations
                        // are inserted into OCB. But which component is adding the registrations?
                        var device = {
                            id: context.id,
                            name: context.id,
                            type: context.type,
                            active: config.types[context.type].active, // only active used in this VERSION
                            lazy: context.lazy,
                            commands: context.commands,
                            // lazy: config.types[context.type].lazy,
                            // commands: config.types[context.type].commands,
                            service: context.service,
                            subservice: context.subservice,
                            polling: context.polling,
                            trust: context.trust,
                            endpoint: endpointUrl
                        };

                        // loading devices
                        devices[device.id] = [];
                        devices[device.id].push(device);

                        try {
                            async.series([
                                function(callback) {
                                    commonConfig
                                        .getRegistry()
                                        .get(device.id, device.service, device.subservice, function(error) {
                                            if (!error) {
                                                for (var key in config.types) {
                                                    groupService.remove(
                                                        device.service,
                                                        device.subservice,
                                                        '/' + key,
                                                        apikey,
                                                        function(error) {
                                                            if (!error) {
                                                                callback();
                                                            }
                                                        }
                                                    );
                                                }
                                            }
                                        });
                                },
                                function(callback) {
                                    mG.mongoGroup(config);
                                    request(optionsCreation, function(error, response, body) {
                                        if (error) {
                                            logger.error(logContext, 'CREATION GROUP ERROR. Verify OCB connection.');
                                        } else {
                                            logger.info(logContext, 'GROUPS SUCCESSFULLY CREATED!');
                                        }
                                    });
                                    callback();
                                }
                            ]);

                            for (var key in config.contexts) {
                                async.series([
                                    function(callback) {
                                        var del = {
                                            url:
                                                'http://localhost:' +
                                                config.server.port +
                                                '/iot/devices/' +
                                                config.contexts[key].id,
                                            method: 'DELETE',
                                            headers: {
                                                'fiware-service': config.service,
                                                'fiware-servicepath': config.subservice
                                            }
                                        };

                                        request(del, function(error, response, body) {
                                            if (error) {
                                                logger.error(logContext, 'Device delete error.');
                                            } else {
                                                logger.info(logContext, 'device deleted!');
                                                callback();
                                            }
                                        });
                                    },
                                    function(callback) {
                                        // NOTE: This registration will also trigger a Context Provider registration in the Context Broker for all its lazy attributes.
                                        // Registers a new device
                                        iotAgentLib.register(device, function(err) {
                                            if (err) {
                                                console.log('ERROR iotAgentLib.register');
                                                // skip context
                                                logger.error(
                                                    logContext,
                                                    'could not register OCB context ' + context.id + ''
                                                );
                                                logger.info(logContext, JSON.stringify(err));
                                                context.mappings.forEach(function(mapping) {
                                                    initSubscriptionBroker(context, mapping);
                                                });
                                            } else {
                                                // init subscriptions
                                                logger.info(
                                                    logContext,
                                                    'registered successfully OCB context ' + context.id
                                                );

                                                // Each mapping between OPCUA and OCB is processed
                                                context.mappings.forEach(function(mapping) {
                                                    initSubscriptionBroker(context, mapping);
                                                });
                                            }
                                        });
                                    }
                                ]);
                            }
                        } catch (err) {
                            logger.error(logContext, 'error registering OCB context');
                            logger.info(logContext, JSON.stringify(err));
                            callback();
                        }
                    });
                    callback();
                },

                function(callback) {
                    /*
                    if (doBrowse) {
                        var attributeTriggers = [];
                        config.contextSubscriptions.forEach(function(cText) {
                            cText.mappings.forEach(function(map) {
                                attributeTriggers.push(map.ocb_id);
                            });
                        });

                        config.contextSubscriptions.forEach(function(context) {
                            logger.info(logContext, 'subscribing OCB context ' + context.id + ' for attributes: ');
                            attributeTriggers.forEach(function(attr) {
                                logger.info(logContext, 'attribute name: ' + attr + ''.cyan.bold);
                            });
                            var device = {
                                id: context.id,
                                name: context.id,
                                type: context.type,
                                service: config.service,
                                subservice: config.subservice
                            };
                            try {
                                iotAgentLib.subscribe(device, attributeTriggers, attributeTriggers, function(err) {
                                    if (err) {
                                        logger.error(
                                            logContext,
                                            'There was an error subscribing device [%s] to attributes [%j]'.bold.red,
                                            device.name,
                                            attributeTriggers
                                        );
                                    } else {
                                        logger.info(
                                            logContext,
                                            'Successfully subscribed device [%s] to attributes[%j]'.bold.yellow,
                                            device.name,
                                            attributeTriggers
                                        );
                                    }
                                    callback();
                                });
                            } catch (err) {
                                logger.error(
                                    logContext,
                                    'There was an error subscribing device [%s] to attributes [%j]',
                                    device.name,
                                    attributeTriggers
                                );
                                logger.info(logContext, JSON.stringify(err).red.bold);
                                callback();
                                return;
                            }
                        });
                    } else {
                        callback();
                    }
                    */
                },

                // ------------------------------------------
                // set up a timer that shuts down the client after a given time
                function(callback) {
                    logger.info(logContext, 'Starting timer ', timeout);
                    var timerId;
                    if (timeout > 0) {
                        timerId = setTimeout(function() {
                            tAs.terminateAllSubscriptions(the_subscriptions);
                            // TODO don't know if this approach may be broken (see commented code below)
                            // but let's assume it won't matter anyway as we are shutting down...
                            callback();
                            // the_subscription.once("terminated", function() {
                            //    callback();
                            // });
                            // the_subscription.terminate();
                        }, timeout);
                    } else if (timeout == -1) {
                        //  Infinite activity
                        // NODE1
                        // logger.info(logContext, 'NO Timeout set!!!'.bold.cyan);
                        logger.info(logContext, 'NO Timeout set!!!');
                    } else {
                        callback();
                    }
                },
                // ------------------------------------------
                // when the timer goes off, we first close the session...
                function(callback) {
                    logger.info(logContext, ' closing session');
                    the_session.close(function(err) {
                        logger.info(logContext, ' session closed', err);
                        callback();
                    });
                },

                // ...and finally the the connection
                function(callback) {
                    logger.info(logContext, ' Calling disconnect');
                    client.disconnect(callback);
                }
            ],
            function(err) {
                // this is called whenever a step call callback() passing along an err object
                logger.error(logContext, ' disconnected'.cyan);

                if (err) {
                    logger.error(logContext, ' client : process terminated with an error'.red);
                    logger.error(logContext, ' error', err);
                    logger.error(logContext, ' stack trace', err.stack);
                } else {
                    logger.info(logContext, 'success !!   ');
                }
                // force disconnection
                if (client) {
                    client.disconnect(function() {
                        var exit = require('exit');
                        logger.info(logContext, 'Exiting');

                        exit();
                    });
                }
            }
        );

        // not much use for this...
        process.on('error', function(err) {
            logger.error(logContext, ' UNTRAPPED ERROR', err.message);
        });

        // handle CTRL+C
        // var user_interruption_count = 0;

        process.on('SIGINT', function() {
            logger.error(logContext, ' user interruption ...');
            logger.info(logContext, ' Received client interruption from user ');
            logger.info(logContext, ' shutting down ...');
            tAs.terminateAllSubscriptions(the_subscriptions);
            if (the_session != null && client != null) disconnect.disconnect(the_session, client);
            process.exit(1);
        });

        // Lazy Attributes handler
        function queryContextHandler(id, type, service, subservice, attributes, callback) {
            logContext.op = 'Index.QueryContextHandler';

            contextSubscriptions.forEach(function(contextSubscription) {
                if (contextSubscription.id === id) {
                    contextSubscription.mappings.forEach(function(mapping) {
                        async.forEachSeries(
                            attributes,
                            function(attribute, callback2) {
                                if (attribute === mapping.ocb_id) {
                                    the_session.readVariableValue(mapping.opcua_id, function(err, dataValue) {
                                        if (dataValue.value == null) return;
                                        logger.info(logContext, 'dataValue.value.value=' + dataValue.value.value);
                                        if (!err) {
                                            logger.info(logContext, ' read variable % = ', dataValue.toString());
                                        }

                                        attributes_array = [];
                                        attributes_array.push(attribute);

                                        callback(
                                            err,
                                            cR.createResponse(id, type, attributes_array, '' + dataValue.value.value)
                                        );
                                    });
                                }
                            },
                            null
                        );
                    });
                }
            });
        }

        /*
		function updateContextHandler(id, type, service, subservice, attributes, callback) {
		}
		*/

        var result = {};
        function pollcommands() {
            var commands = require('../../node_modules/iotagent-node-lib/lib/services/commands/commandService');
            var commandListAllDevices = [];
            var count = 0;
            // each of the following steps is executed in due order
            // each step MUST call callback() when done in order for the step sequence to proceed further
            async.series([
                // ------------------------------------------
                function(callback) {
                    for (var i = 0, len = config.contexts.length; i < len; i++) {
                        var context = config.contexts[i];
                        commands.list(config.service, config.subservice, context.id, function(error, commandList) {
                            count += commandList.count;
                            commandListAllDevices.push.apply(commandListAllDevices, commandList.commands);
                            if (i == len) callback();
                        });
                    }
                },

                function(callback) {
                    result.count = count;
                    result.commands = commandListAllDevices;

                    if (result.count != 0) {
                        var attr = [
                            {
                                name: commandListAllDevices[0].name, // TODO: Is this working for only one device?
                                type: commandListAllDevices[0].type,
                                value: commandListAllDevices[0].value
                            }
                        ];
                        commandContextHandler(
                            commandListAllDevices[0].deviceId,
                            commandListAllDevices[0].deviceId,
                            config.service,
                            config.subservice,
                            attr,
                            function(err) {
                                if (err) {
                                    logger.error(logContext, ' ERROR ON POLLING COMMAND');
                                } else {
                                    commands.remove(
                                        config.service,
                                        config.subservice,
                                        commandListAllDevices[0].deviceId,
                                        commandListAllDevices[0].name,
                                        function(error) {
                                            if (error) logger.error(logContext, 'ERROR ON REMOVING COMMAND' + error);
                                        }
                                    );
                                }
                            }
                        );
                    }
                }
            ]);
        }

        if (polling_up) {
            setInterval(pollcommands, polling_commands_timer);
        }

        // Handling command execution requests
        function commandContextHandler(id, type, service, subservice, attributes, callback) {
            logContext.op = 'Index.CommandContextHandler';

            function executeCommand() {
                // contextSubscription viene preso in considerazione solo in fase di esecuzione del comando
                // Fino ad allora l'agent dichiara di essere il responsabile per i comandi aventi un determinato nome

                // Ciò significa che implementando l'API è necessario conservare queste info (opcua_id in particolare) da qualche parte
                contextSubscriptions.forEach(function(contextSubscription) {
                    if (contextSubscription.id === id) {
                        contextSubscription.mappings.forEach(function(mapping) {
                            attributes.forEach(function(attribute) {
                                if (attribute.name === mapping.ocb_id) {
                                    var input = mapping.inputArguments;
                                    if (input != null) {
                                        var i = 0;
                                        input.forEach(function(inputType) {
                                            inputType['value'] = attribute.value[i++];
                                        });
                                    }
                                    var methodsToCall = [];
                                    methodsToCall.push({
                                        objectId: '' + mapping.object_id,
                                        methodId: '' + mapping.opcua_id,

                                        inputArguments: input
                                    });
                                    logger.info(logContext, 'method to call =' + JSON.stringify(methodsToCall));

                                    // Calling methods on OPCUA Side
                                    the_session.call(methodsToCall, function(err, results) {
                                        callback(err, {
                                            id: id,
                                            type: type,
                                            attributes: attributes
                                        });

                                        contexts.forEach(function(context) {
                                            iotAgentLib.getDevice(
                                                context.id,
                                                context.service,
                                                context.subservice,
                                                function(err, device) {
                                                    if (err) {
                                                        logger.error(
                                                            logContext,
                                                            'could not find the OCB context ' + context.id + ''
                                                        );
                                                        // NODE1
                                                        // logger.info(logContext, JSON.stringify(err).red.bold);
                                                        logger.info(logContext, JSON.stringify(err));
                                                        eUv.executeUpdateValues(
                                                            device,
                                                            id,
                                                            type,
                                                            service,
                                                            subservice,
                                                            attributes,
                                                            'ERROR',
                                                            'generic error',
                                                            callback
                                                        );
                                                    } else {
                                                        if (results[0].statusCode.name === opcua.StatusCodes.Bad.name) {
                                                            eUv.executeUpdateValues(
                                                                device,
                                                                id,
                                                                type,
                                                                service,
                                                                subservice,
                                                                attributes,
                                                                'ERROR',
                                                                results[0].outputArguments[0].value,
                                                                callback
                                                            );
                                                        } else {
                                                            if (results[0].outputArguments[0] !== undefined) {
                                                                if (
                                                                    Array.isArray(results[0].outputArguments[0].value)
                                                                ) {
                                                                    results[0].outputArguments[0].value =
                                                                        results[0].outputArguments[0].value[0];
                                                                }
                                                                eUv.executeUpdateValues(
                                                                    device,
                                                                    id,
                                                                    type,
                                                                    service,
                                                                    subservice,
                                                                    attributes,
                                                                    'OK',
                                                                    results[0].outputArguments[0].value,
                                                                    callback
                                                                );
                                                            }
                                                        }
                                                    }
                                                }
                                            );
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
            async.waterfall([async.apply(executeCommand)], callback);
        }
        // iotAgentLib.setDataUpdateHandler(updateContextHandler);
        iotAgentLib.setDataQueryHandler(queryContextHandler);
        iotAgentLib.setCommandHandler(commandContextHandler);

        /**
         * This callback is invoked every time a request for adding a new device
         * is sent to iotAgentLib server.
         *
         * @param {Object} device The device parameter contains the newly created device
         * @param {Object} callback
         */
        function provisioningHandler(device, provisioningCallback) {
            logContext.op = 'Index.IoTAgentProvisioningHandler';

            // Handling duplicated devices
            var deviceExists = false;

            for (var dev in devices) {
                if (dev == device.id) {
                    deviceExists = true;
                    break;
                }
            }

            if (deviceExists == false) {
                executed = true;
                // Here only if device added with successfully

                // Pause device checking
                timerId.pause();
                setTimeout(function() {
                    timerId.resume();
                }, 5000);

                async.series(
                    [
                        function(callback) {
                            activeDeviceSubs(device, callback);
                        },
                        function(callback) {
                            updateContextSubscriptions(device, callback);
                        }
                    ],
                    function(err, results) {
                        console.log('@@@ LAST CALLBACK ' + new Date().getTime());
                        provisioningCallback(null, device);
                    }
                );

                // commandDeviceSubs(device);
                // lazyDeviceSubs(device);

                /*
				var newDevice={};
				if (config.contextBroker.ngsiVersion == undefined){
					createInitialEntityNgsi1(device, newDevice,  function(error, results) {
					});
				}else{
					if(config.contextBroker.ngsiVersion=='v2') {
						createInitialEntityNgsi2(device, newDevice, function(error, results) {

						});
					} else {
						createInitialEntityNgsi1(device, newDevice, function(error, results) {

						});
					}
				}
				*/
            } else {
                logger.info(logContext, 'Device already exists. id = ' + device.id);
                provisioningCallback(null, device);
            }
        }

        // repeat with the interval of checkTimer seconds
        let timerId = new _setInterval(() => {
            Object.keys(devicesSubs).forEach(function(key) {
                iotAgentLib.getDevice(key, devices[key][0].service, devices[key][0].subservice, function(
                    error,
                    device
                ) {
                    if (error) {
                        devicesSubs[key].forEach(function(subscription) {
                            logger.debug('terminating...');
                            subscription.terminate();
                            logger.debug('terminating...done');
                        });
                        delete devicesSubs[key];
                        delete devices[key];
                    }
                });
            });
        }, checkTimer);

        /*
         * Utility function. TODO: move it into a separate file
         * For OPCUA nodeid chars not in template
         */
        function parsePayloadProperties(jsonAttribute) {
            jsonAttribute = jsonAttribute.replace(/:/g, ';');
            jsonAttribute = jsonAttribute.replace(/\*/g, '=');

            return jsonAttribute;
        }

        // Check if the specified node exists in the server address space
        function doesOPCUANodeExist(opcuaNodeId, callback2) {
            var exitStatus = false;

            if (!the_session) {
                throw new Error('No Connection');
            }

            var node = {
                nodeId: opcuaNodeId
            };

            // BrowseFileDescriptions
            const b = [
                {
                    nodeId: node.nodeId,
                    referenceTypeId: 'Organizes',
                    includeSubtypes: true,
                    browseDirection: opcua.BrowseDirection.Forward,
                    resultMask: 0x3f
                },
                {
                    nodeId: node.nodeId,
                    referenceTypeId: 'Aggregates',
                    includeSubtypes: true,
                    browseDirection: opcua.BrowseDirection.Forward,
                    resultMask: 0x3f
                },
                {
                    nodeId: node.nodeId,
                    referenceTypeId: 'HasSubtype',
                    includeSubtypes: true,
                    browseDirection: opcua.BrowseDirection.Forward,
                    resultMask: 0x3f
                }
            ];

            the_session.browse(b, callback2);
        }

        /**
         * Removes an OPCUA Item from the device object param that will be passed to provisioningHandler callback
         *
         * @param {Object} opcuaNodeId		the ID of opcua node that will be removed
         * @param {Object} nodeType			'active', 'lazy', 'command'
         * @param {Object} device			Device object that will be stored in the database.
         */
        function removeOPCUANodeFromDevice(opcuaNodeId, nodeType, device) {
            console.log('@@@ removeOPCUANodeFromDevice ' + new Date().getTime());

            var tmpNodesArray = device[nodeType];
            if (tmpNodesArray !== undefined) {
                var index = tmpNodesArray.findIndex((x) => x.object_id === opcuaNodeId);

                if (index > -1) {
                    tmpNodesArray.splice(index, 1);
                }

                device[nodeType] = tmpNodesArray;
            }
        }

        /*
         * Handles the active attributes of the device
         * For each of these attributes both OPCUA and OCB side subscriptions are handled
         */
        function activeDeviceSubs(device, asyncCallback) {
            var deviceMappings = [];

            // Handling ACTIVE attributes
            if (device.active != undefined) {
                device.active.forEach(function(attribute, index) {
                    var mapping = {};

                    // Replacing prohibited chars
                    attribute.object_id = parsePayloadProperties(attribute.object_id);

                    // Ignoring OPCUA items that are not available on OPCUA server side

                    doesOPCUANodeExist(attribute.object_id, function(err, results) {
                        if (!err) {
                            let result = results[0];
                            console.log('@@@ BROWSE RESULT' + new Date().getTime());

                            // Fetch the Status in another way
                            var nodes_to_read = [
                                {
                                    nodeId: attribute.object_id,
                                    attributeId: opcua.AttributeIds.Value
                                }
                            ];

                            the_session.read(nodes_to_read, function(err, response) {
                                console.log('TODO @@@ SESSION_READ');
                                console.log(JSON.stringify(response));
                            });

                            if (result.statusCode == opcua.StatusCodes.Good) {
                                mapping.ocb_id = attribute.name;
                                mapping.opcua_id = attribute.object_id;
                                mapping.object_id = null;
                                mapping.inputArguments = [];
                                deviceMappings.push(mapping);
                            } else {
                                removeOPCUANodeFromDevice(attribute.object_id, 'active', device);
                            }

                            if (index == device.active.length - 1) {
                                deviceMappings.forEach(function(mapping) {
                                    var context = {};
                                    context.id = device.id;
                                    context.type = device.type;
                                    context.service = device.service;
                                    context.subservice = device.subservice;
                                    context.polling = false;

                                    initSubscriptionBroker(context, mapping);
                                });

                                devices[device.id] = [];
                                devices[device.id].push(device);
                                asyncCallback();
                            }
                        }
                    });

                    /* doesOPCUANodeExist(attribute.object_id, function(exitStatus) {
						if(exitStatus == true) {
							mapping.ocb_id = attribute.name;
							mapping.opcua_id = attribute.object_id;
							mapping.object_id = null;
							mapping.inputArguments = [];
							deviceMappings.push(mapping);
						} else {
							removeOPCUANodeFromDevice(attribute.object_id, 'active', device);
						}
					});
					*/
                });
            }
        }

        // Updates contextSubscriptions array when a new device is provisioned
        function updateContextSubscriptions(device, asyncCallback) {
            // creating contextSubscriptions obj item
            contextSubscriptionObj = {};
            contextSubscriptionObj.id = device.id;
            contextSubscriptionObj.type = device.type;
            contextSubscriptionObj.mappings = [];

            async.series(
                [
                    function(callback) {
                        // handling commands
                        if (device.commands !== undefined) {
                            device.commands.forEach(function(command, index) {
                                // Replacing prohibited chars
                                command.object_id = parsePayloadProperties(command.object_id);

                                // TODO: Is it possible to generalize doesOPCUANodeExist ?
                                doesOPCUANodeExist(command.object_id, function(err, results) {
                                    if (!err) {
                                        let result = results[0];
                                        console.log('@@@ COMMAND RESULTS' + new Date().getTime());

                                        if (result.statusCode == opcua.StatusCodes.Good) {
                                            var mapping = {};
                                            async.series([
                                                function(callback2) {
                                                    mapping.ocb_id = command.name;
                                                    mapping.opcua_id = command.object_id;

                                                    mapping.object_id = 'ns=3;i=1000'; // TODO: How to fetch this from OPCUA?
                                                    mapping.inputArguments = [];

                                                    // Fetch the DataType of each InputArguments from OPCUA server
                                                    var nodes_to_read = [
                                                        {
                                                            nodeId: command.object_id + '-InputArguments',
                                                            attributeId: opcua.AttributeIds.Value
                                                        }
                                                    ];

                                                    the_session.read(nodes_to_read, function(err, response) {
                                                        var inputArguments = response[0].value.value;

                                                        if (inputArguments != null) {
                                                            // There is at least an argument
                                                            inputArguments.forEach(function(inputArgument) {
                                                                var dataType = {};
                                                                dataType.type = inputArgument.name;
                                                                dataType.dataType = inputArgument.dataType.value;

                                                                mapping.inputArguments.push(dataType);
                                                            });
                                                        }
                                                        callback2();
                                                    });
                                                },
                                                function(callback2) {
                                                    contextSubscriptionObj.mappings.push(mapping);
                                                    callback2();
                                                }
                                            ]);
                                        } else {
                                            removeOPCUANodeFromDevice(command.object_id, 'command', device);
                                        }
                                    }

                                    if (index == device.commands.length - 1) {
                                        callback();
                                    }
                                });
                            });
                        }
                    },
                    function(callback) {
                        // handling lazy attributes
                        if (device.lazy !== undefined) {
                            device.lazy.forEach(function(lazy) {
                                var mapping = {};

                                lazy.object_id = parsePayloadProperties(lazy.object_id);

                                doesOPCUANodeExist(lazy.object_id, function(err, results) {
                                    if (!err) {
                                        let result = results[0];
                                        console.log('@@@ BROWSE RESULT' + new Date().getTime());

                                        if (result.statusCode == opcua.StatusCodes.Good) {
                                            mapping.ocb_id = lazy.name;
                                            mapping.opcua_id = lazy.object_id;

                                            // TODO: fetch these data from OPCUA server?
                                            mapping.object_id = 'ns=3;i=1000'; // mapping.object_id = 'ns=3;i=1000';
                                            mapping.inputArguments = [];

                                            contextSubscriptionObj.mappings.push(mapping);
                                        } else {
                                            removeOPCUANodeFromDevice(lazy.object_id, 'lazy', device);
                                        }
                                    }
                                });

                                // Ignoring OPCUA items that are not available on OPCUA server side
                                // if(doesOPCUANodeExist(lazy.object_id) == false) {
                                //	removeOPCUANodeFromDevice(lazy.object_id, 'lazy', device);
                                //	return; // prevent node from being inserted into contextSubscriptions array - forEach continue
                                // }
                            });
                        }

                        callback();
                    },
                    function(callback) {
                        if (device.commands !== undefined || device.lazy !== undefined) {
                            contextSubscriptions.push(contextSubscriptionObj);
                        }
                        callback();
                    }
                ],
                function(err, results) {
                    asyncCallback();
                }
            );
        }

        function removeDeviceHandler(deviceToDelete, removalCallback) {
            // Remove device from devices array
            delete devices[deviceToDelete.id];

            // Remove contextSubscription
            var index = contextSubscriptions.findIndex((x) => x.id === deviceToDelete.id);
            contextSubscriptions.splice(index, 1);

            removalCallback(null, deviceToDelete);
        }

        /*
         * Handles commands
         */
        /*
        function commandDeviceSubs(device) {
			// creating contextSubscriptions obj item
			contextSubscriptionObj = {};
			contextSubscriptionObj.id = device.id;
			contextSubscriptionObj.type = device.type;
			contextSubscriptionObj.mappings = [];

			device.commands.forEach(function(command) {
				command.object_id = parsePayloadProperties(command.object_id);

				var mapping = {};
				mapping.ocb_id = command.name;
				mapping.opcua_id = command.object_id;

				// TODO: fetch these data from OPCUA server?
				mapping.object_id = 'ns=3;i=1000'; 				// mapping.object_id = 'ns=3;i=1000';
				var dataType = {
					"dataType" : 6,
					"type" : "SensorIndex"
				};
				mapping.inputArguments = [dataType];

				contextSubscriptionObj.mappings.push(mapping);
			});

			contextSubscriptions.push(contextSubscriptionObj);
		}
		*/

        /*
         * Handles lazy devices
         */
        /*
		function lazyDeviceSubs(device) {
			device.lazy.forEach(function(lazy) {
				.object_id = parsePayloadProperties(lazy.object_id);

				var mapping = {};
				mapping.ocb_id = lazy.name;
				mapping.opcua_id = lazy.object_id;

				// TODO: fetch these data from OPCUA server?
				mapping.object_id = 'ns=3;i=1000'; // mapping.object_id = 'ns=3;i=1000';
				mapping.inputArguments = [];

				contextSubscriptionObj.mappings.push(mapping);
			});
		}
		*/

        iotAgentLib.setProvisioningHandler(provisioningHandler);
        iotAgentLib.setRemoveDeviceHandler(removeDeviceHandler);

        /**
         * Creates the response handler for the initial entity creation request NGSIv1.
         * This handler basically deals with the errors that could have been rised during
         * the communication with the Context Broker.
         *
         * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
         * @param {Object} newDevice        Device object that will be stored in the database.
         * @return {function}               Handler to pass to the request() function.
         */
        /*
        function createInitialEntityHandlerNgsi1(deviceData, newDevice, callback) {
            return function handleInitialEntityResponse(error, response, body) {
                if (error) {
                    logger.error(
                        logContext,
                        'ORION-001: Connection error creating inital entity in the Context Broker: %s',
                        error
                    );

                    alarms.raise(constants.ORION_ALARM, error);

                    callback(error);
                } else if (response && body && response.statusCode === 200) {
                    var errorField = null;

                    if (errorField) {
                        logger.error(logContext, 'Update error connecting to the Context Broker: %j', errorField);
                        callback(JSON.stringify(errorField));
                    } else {
                        alarms.release(constants.ORION_ALARM);
                        logger.debug(logContext, 'Initial entity created successfully.');
                        callback(null, newDevice);
                    }
                } else {
                    var errorObj;

                    logger.error(
                        logContext,
                        'Protocol error connecting to the Context Broker [%d]: %s',
                        response.statusCode,
                        body
                    );

                    errorObj = new 'error ='() + deviceData.id + ' type=' + deviceData.type + ' body=' + body;

                    callback(errorObj);
                }
            };
        }
        * */

        /**
         * Creates the response handler for the initial entity creation request using NGSIv2.
         * This handler basically deals with the errors that could have been rised during
         * the communication with the Context Broker.
         *
         * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
         * @param {Object} newDevice        Device object that will be stored in the database.
         * @return {function}               Handler to pass to the request() function.
         */
        /*
        function createInitialEntityHandlerNgsi2(deviceData, newDevice, callback) {
            return function handleInitialEntityResponse(error, response, body) {
                if (error) {
                    logger.error(
                        logContext,
                        'ORION-001: Connection error creating inital entity in the Context Broker: %s',
                        error
                    );

                    alarms.raise(constants.ORION_ALARM, error);

                    callback(error);
                } else if (response && response.statusCode === 204) {
                    alarms.release(constants.ORION_ALARM);
                    logger.debug(logContext, 'Initial entity created successfully.');
                    callback(null, newDevice);
                } else {
                    var errorObj;

                    logger.error(
                        logContext,
                        'Protocol error connecting to the Context Broker [%d]: %s',
                        response.statusCode,
                        body
                    );

                    errorObj = new errors.EntityGenericError(deviceData.id, deviceData.type, body);

                    callback(errorObj);
                }
            };
        }
        */

        /**
         * Creates the initial entity representing the device in the Context Broker using NGSIv2.
         * This is important mainly to allow the rest of the updateContext operations to be performed.
         *
         * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
         * @param {Object} newDevice        Device object that will be stored in the database.
         */
        /*
        function createInitialEntityNgsi2(deviceData, newDevice, callback) {
            var options = {
                url: config.contextBroker.url + '/v2/entities?options=upsert',
                method: 'POST',
                json: {
                    id: String(deviceData.name),
                    type: deviceData.type
                },
                headers: {
                    'fiware-service': deviceData.service,
                    'fiware-servicepath': deviceData.subservice
                }
            };

            jsonConcat(options.json, formatAttributesNgsi2(deviceData.active, false));
            jsonConcat(options.json, formatAttributesNgsi2(deviceData.staticAttributes, true));
            jsonConcat(options.json, formatCommandsNgsi2(deviceData.commands));

            if (config.timestamp && !utils.isTimestampedNgsi2(options.json)) {
                options.json[constants.TIMESTAMP_ATTRIBUTE] = {
                    type: constants.TIMESTAMP_TYPE_NGSI2,
                    value: moment()
                };
            }

            logger.debug(
                logContext,
                'Creating initial entity in the Context Broker:\n %s',
                JSON.stringify(options, null, 4)
            );

            request(options, createInitialEntityHandlerNgsi2(deviceData, newDevice, callback));
        }
		*/

        /**
         * Creates the initial entity representing the device in the Context Broker using NGSIv1.
         * This is important mainly to allow the rest of the updateContext operations to be performed
         * using an UPDATE action instead of an APPEND one.
         *
         * @param {Object} deviceData       Object containing all the deviceData needed to send the registration.
         * @param {Object} newDevice        Device object that will be stored in the database.
         */
        /*
        function createInitialEntityNgsi1(deviceData, newDevice, callback) {
            var options = {
                url: config.contextBroker.url + '/v1/updateContext',
                method: 'POST',
                json: {
                    contextElements: [
                        {
                            type: deviceData.type,
                            isPattern: 'false',
                            id: String(deviceData.name),
                            attributes: []
                        }
                    ],
                    updateAction: 'APPEND'
                },
                headers: {
                    'fiware-service': deviceData.service,
                    'fiware-servicepath': deviceData.subservice
                }
            };

            function formatAttributes(originalVector) {
                var attributeList = [];

                if (originalVector && originalVector.length) {
                    for (var i = 0; i < originalVector.length; i++) {
                        // (#628) check if attribute has entity_name:
                        // In that case attribute should not be appear in current entity
                        if (!originalVector[i].entity_name) {
                            attributeList.push({
                                name: originalVector[i].name,
                                type: originalVector[i].type,
                                value: null
                            });
                        }
                    }
                }

                return attributeList;
            }

            function formatCommands(originalVector) {
                var attributeList = [];

                if (originalVector && originalVector.length) {
                    for (var i = 0; i < originalVector.length; i++) {
                        attributeList.push({
                            name: originalVector[i].name + constants.COMMAND_STATUS_SUFIX,
                            type: constants.COMMAND_STATUS,
                            value: 'UNKNOWN'
                        });
                        attributeList.push({
                            name: originalVector[i].name + constants.COMMAND_RESULT_SUFIX,
                            type: constants.COMMAND_RESULT,
                            value: ' '
                        });
                    }
                }

                return attributeList;
            }

            options.json.contextElements[0].attributes = [].concat(
                formatAttributes(deviceData.active),
                deviceData.staticAttributes,
                formatCommands(deviceData.commands)
            );

            if (config.timestamp && !utils.isTimestamped(options.json)) {
                options.json.contextElements[0].attributes.push({
                    name: constants.TIMESTAMP_ATTRIBUTE,
                    type: constants.TIMESTAMP_TYPE,
                    value: ' '
                });
            }

            logger.debug(
                logContext,
                'Creating initial entity in the Context Broker:\n %s',
                JSON.stringify(options, null, 4)
            );

            request(options, createInitialEntityHandlerNgsi1(deviceData, newDevice, callback));
        }
        */
        var handlerCalled = false;
    }
};
