/*
module.exports = require('./lib/fiware-iotagent-lib');
//COME DA GUIDA
    config = require('./config');
    console.log("config...");
    //Riceve un singolo parametro: la config dell'agent
    module.exports.activate(config, function(error) {
  console.log("activate...");
  if (error) {
      
    console.log('There was an error activating the IOTA');
    process.exit(1);
  }
});

console.log("closing...");
*/




try{
// node-opcue dependencies
require("requirish")._(module);
var constants = require('./lib/constants');
var ngsi = require('./lib/services/ngsi/ngsiService');
var treeify = require('treeify');
var _ = require("underscore");
var util = require("util");
//var crawler = require('./node_modules/node-opcua/lib/client/node_crawler.js');
var async = require("async");

var opcua = require("node-opcua");
var dataType = opcua.DataType;
var VariantArrayType = opcua.VariantArrayType;
var NodeCrawler = opcua.NodeCrawler;
// iotagent-node-lib dependencies
var iotAgentLib = require('./lib/fiware-iotagent-lib');











var argv = require('yargs')
    .wrap(132)
    //.usage('Usage: $0 -d --endpoint <endpointUrl> [--securityMode (NONE|SIGNANDENCRYPT|SIGN)] [--securityPolicy (None|Basic256|Basic128Rsa15)] ')

    .demand("endpoint")
    .string("endpoint")
    .describe("endpoint", "the end point to connect to ")

    .string("securityMode")
    .describe("securityMode", "the security mode")

    .string("securityPolicy")
    .describe("securityPolicy", "the policy mode")

    .string("userName")
    .describe("userName", "specify the user name of a UserNameIdentityToken ")

    .string("password")
    .describe("password", "specify the password of a UserNameIdentityToken")

    .string("timeout")
    .describe("timeout", " the timeout of the session in second =>  (-1 for infinity)")

    .string("debug")
    .describe("debug", " display more verbose information")

    .string("browse")
    .describe("browse", " browse Objects from opc-ua server. Fulfill browseServerOptions section in config file")

    .string("autoConfig")
    .describe("autoConfig", " Auto configuration: update config json file")



    .alias('e', 'endpoint')
    .alias('s', 'securityMode')
    .alias('P', 'securityPolicy')
    .alias("u", 'userName')
    .alias("p", 'password')
    .alias("t", 'timeout')
    .alias('a', 'autoConfig')
    .alias("d", "debug")
    .alias("b", "browse")
    .example("simple_client  --endpoint opc.tcp://localhost:49230 -P=Basic256 -s=SIGN")
    .example("simple_client  -e opc.tcp://localhost:49230 -P=Basic256 -s=SIGN -u JoeDoe -p P@338@rd ")
    .example("simple_client  --endpoint opc.tcp://localhost:49230  -n=\"ns=0;i=2258\"")

    .argv;

var endpointUrl = argv.endpoint;
if (!endpointUrl) {
    require('yargs').showHelp();
    return;
}
var doAuto = argv.autoConfig ? true : false;









/*console.log('----------------    MAPPING TOOL    ----------------');


var exec = require('child_process').execSync;


try {
   
    var child = exec('/Library/Java/JavaVirtualMachines/jdk1.8.0_25.jdk/Contents/Home/bin/java -jar test.jar -e '+endpointUrl);
    console.log("Automatic configuration successfully created. Loading new configuration...".cyan);


  } catch (ex) {
    console.log("There is a problem with automatic configuration. Loading old configuration (if exists)...".red);
  }


 
clearInterval(loadingBar);
module.exports = child;

console.log('----------------------------------------------------');*/


//var exec = require('child_process').execSync;

if (doAuto){
    console.log('----------------    MAPPING TOOL    ----------------');

    var loadingBar;
    loadingBar=setInterval(function(){  process.stdout.write('.'); }, 3000);
    
    var exec = require('child_process').exec;

try {
    var child = exec('java -jar mapping_tool.jar  -e '+endpointUrl+' -f config.properties'
    , function(err, stdout, stderr) {

        clearInterval(loadingBar);
       
        if (err) {
            console.log("\nThere is a problem with automatic configuration. Loading old configuration (if exists)...".red);

     
        }else{
            console.log("\nAutomatic configuration successfully created. Loading new configuration...".cyan);

        }
       
       run();
        });
    
  } catch (ex) {
    clearInterval(loadingBar);

    console.log("\nThere is a problem with automatic configuration. Loading old configuration (if exists)...".red);
  }


 
module.exports = child;

}else{
    run();
}

function run(){

console.log('----------------------------------------------------');





// configuration of iotagent-node-lib
var config = require('./config');



var securityMode = opcua.MessageSecurityMode.get(argv.securityMode || "NONE");
if (!securityMode) {
    throw new Error("Invalid Security mode , should be " + opcua.MessageSecurityMode.enums.join(" "));
}

var securityPolicy = opcua.SecurityPolicy.get(argv.securityPolicy || "None");
if (!securityPolicy) {
    throw new Error("Invalid securityPolicy , should be " + opcua.SecurityPolicy.enums.join(" "));
}

var timeout = parseInt(argv.timeout) * 1000 || -1; //604800*1000; //default 20000

var doBrowse = argv.browse ? true : false;

console.log("endpointUrl         = ".cyan, endpointUrl);
console.log("securityMode        = ".cyan, securityMode.toString());
console.log("securityPolicy      = ".cyan, securityPolicy.toString());
console.log("timeout             = ".cyan, timeout ? timeout : " Infinity ");



















// set to false to disable address space crawling: might slow things down if the AS is huge
var doCrawling = argv.crawl ? true : false;

var client = null;
var the_session = null;
var the_subscriptions = [];
var contexts = [];
//GAB
var contextSubscriptions = config.contextSubscriptions;
//END GAB
var methods = [];


function removeSuffixFromName(name, suffix) {
    if (name.indexOf(suffix) > -1) {
        var str = name.replace(suffix, "");
        return str;
    }
    return name;
}

function terminateAllSubscriptions() {
    if (the_subscriptions) {
        the_subscriptions.forEach(function (subscription) {
            console.log("terminating subscription: ", subscription.subscriptionId);
            subscription.terminate();
        });
    }
}

function disconnect() {
    console.log(" closing session");
    the_session.close(function (err) {
        console.log(" session closed", err);
    });

    console.log(" Calling disconnect");
    client.disconnect(function (err) {
        console.log(" disconnected", err);
    });
}







function initSubscriptionBroker(context, mapping) {
    // TODO this stuff too should come from config
    var parameters = {
        requestedPublishingInterval: 100,
        requestedLifetimeCount: 1000,
        requestedMaxKeepAliveCount: 12,
        maxNotificationsPerPublish: 10,
        publishingEnabled: true,
        priority: 10
    };
    var subscription = new opcua.ClientSubscription(the_session, parameters);

    function getTick() {
        return Date.now();
    }

    var t = getTick();

    subscription.on("started", function () {

        console.log("started subscription: ",
            subscription.subscriptionId);
        console.log(" revised parameters ");
        console.log("  revised maxKeepAliveCount  ",
            subscription.maxKeepAliveCount, " ( requested ",
            parameters.requestedMaxKeepAliveCount + ")");
        console.log("  revised lifetimeCount      ",
            subscription.lifetimeCount, " ( requested ",
            parameters.requestedLifetimeCount + ")");
        console.log("  revised publishingInterval ",
            subscription.publishingInterval, " ( requested ",
            parameters.requestedPublishingInterval + ")");
        console.log("  suggested timeout hint     ",
            subscription.publish_engine.timeoutHint);

    }).on("internal_error", function (err) {

        console.log("received internal error".red.bold);
        console.log(JSON.stringify(err).red.bold);

    }).on("keepalive", function () {

        var t1 = getTick();
        var span = t1 - t;
        t = t1;
        var keepAliveString="keepalive "+ span / 1000 + " "+ "sec"+ " pending request on server = "+
        subscription.publish_engine.nbPendingPublishRequests + "";
        console.log(keepAliveString.gray);

    }).on("terminated", function (err) {

        if (err) {
            console.log("could not terminate subscription: " + subscription.subscriptionId + "".red.bold);
            console.log(JSON.stringify(err).red.bold);
        } else {
            console.log("successfully terminated subscription: " + subscription.subscriptionId);
        }

    });

    the_subscriptions.push(subscription);

    console.log("initializing monitoring: " + mapping.opcua_id);

    var monitoredItem = subscription.monitor(
        {
            nodeId: mapping.opcua_id,
            attributeId: opcua.AttributeIds.Value
        },
        // TODO some of this stuff (samplingInterval for sure) should come from config
        // TODO All these attributes are optional remove ?
        {
            //clientHandle: 13, // TODO need to understand the meaning this! we probably cannot reuse the same handle everywhere
            samplingInterval: 250,
            queueSize: 10000,
            discardOldest: true
        },
        opcua.read_service.TimestampsToReturn.Both
    );

    monitoredItem.on("initialized", function () {
        console.log("started monitoring: " + monitoredItem.itemToMonitor.nodeId.toString());
    });

    monitoredItem.on("changed", function (dataValue) {
        var variableValue = null;
        
        if (dataValue.value && dataValue.value != null)
            variableValue = dataValue.value.value || null;

            //Verify Orion forbidden character
            if (variableValue!==null){
                if (variableValue.toString().indexOf(';') > -1)
                {
                    variableValue=variableValue.toString().replace(/;/g , "comma");
                
                }
                if (variableValue.toString().indexOf('=') > -1)
                {
                    variableValue=variableValue.toString().replace(/=/g , "equal");
                
                }
            }
        console.log(monitoredItem.itemToMonitor.nodeId.toString(), " value has changed to " + variableValue + "".bold.yellow);
        iotAgentLib.getDevice(context.id, context.service, context.subservice, function (err, device) {
            if (err) {
                console.log("could not find the OCB context " + context.id + "".red.bold);
                console.log(JSON.stringify(err).red.bold);
            } else {
              
                function findType(name) {
                    // TODO we only search the 'active' namespace: does it make sense? probably yes
                    if (device==undefined)
                      return null;
                    if (device.active==undefined)
                      return null;

                    for (var i = 0; i < device.active.length; i++) {

                        if (device.active[i].name === name) {

                            return device.active[i].type;
                        }
                    }
                    console.log("ritorno null???");
                    return null;
                }

                /* WARNING attributes must be an ARRAY */
                var attributes = [{
                    name: mapping.ocb_id,
                    type: mapping.type || findType(mapping.ocb_id),
                    value: variableValue,
                    /*
                    metadatas: [
                        {
                            name: "sourceTimestamp",
                            type: "typestamp",
                            value: dataValue.sourceTimestamp
                        }
                    ]
                    */

                }];

                /*attributes=[];
                var attributo1={
                    name: "temperature",
                    type: "float",
                    value: 25.5
                };
                attributes.push(attributo1);
                var attributo2={
                    name: "pressure",
                    type: "integer",
                    value: 255
                };
                attributes.push(attributo2);
                */
                //[{"name":"temperature","type":"float","value":196}]
                /*WARNING attributes must be an ARRAY*/

                //device.name="Room1";
                /*GAB
                if (device.name.indexOf(":") >= 0){
                    var res = device.name.split(":");
                     device.name=res[1];
                }*/
                //END GAB
                //GAB ID
                iotAgentLib.update(device.id, device.type, '', attributes, device, function (err) {
                    if (err) {
                        console.log("error updating " + mapping.ocb_id + " on " + device.name + "".red.bold);
                        console.log("provavo a scrivere " + JSON.stringify(attributes));

                        console.log(JSON.stringify(err).red.bold);
                    } else {
                        console.log("successfully updated " + mapping.ocb_id + " on " + device.name);
                    }
                });
            }
        });
    });

    monitoredItem.on("err", function (err_message) {
        console.log(monitoredItem.itemToMonitor.nodeId.toString(), " ERROR".red, err_message);
    });
}

/*
  @author ascatox 
  Method call on OPCUA Server  
 */
function callMethods(value) {
    //TODO Metodi multipli
    if (!methods) return;
    try {
        methods[0].inputArguments = [{
            dataType: dataType.String,
            arrayType: VariantArrayType.Scalar,
            value: value
        }];
        the_session.call(methods, function (err, results) {
            if (!err)
                console.log("Method invoked correctly with result: ".bold.yellow, results[0].toString());
            else console.log("Error calling Method :".bold.red, err);
        });
    } catch (error) {
        console.log("Error calling Method :".bold.red, error);
    }
}

/*
  @author ascatox 
  Handler for incoming notifications.
 
  @param {Object} device           Object containing all the device information.
  @param {Array} updates           List of all the updated attributes.

 */
function notificationHandler(device, updates, callback) {
    console.log("Data coming from OCB: ".bold.cyan, JSON.stringify(updates));
    callMethods(updates[0].value); //TODO gestire multiple chiamate
}
// each of the following steps is executed in due order
// each step MUST call callback() when done in order for the step sequence to proceed further
async.series([
    //------------------------------------------
    // initialize client connection to the OCB
    function (callback) {
        iotAgentLib.activate(config, function (err) {
            if (err) {
                console.log('There was an error activating the Agent: ' + err.message);
                process.exit(1);
            } else {
                console.log("NotificationHandler attached to ContextBroker");
                iotAgentLib.setNotificationHandler(notificationHandler);

            }
            callback();
        });
    },

    //------------------------------------------
    // initialize client connection to the OPCUA Server
    function (callback) {
        var options = {
            securityMode: securityMode,
            securityPolicy: securityPolicy,
            defaultSecureTokenLifetime: 40000
        };
        console.log("Options = ", options.securityMode.toString(), options.securityPolicy.toString());

        client = new opcua.OPCUAClient(options);

        console.log(" connecting to ", endpointUrl.cyan.bold);
        client.connect(endpointUrl, callback);

        client.on("connection_reestablished", function () {
            console.log(" !!!!!!!!!!!!!!!!!!!!!!!!  CONNECTION RESTABLISHED !!!!!!!!!!!!!!!!!!!");
        });
    },

    //------------------------------------------
    // initialize client session on the OPCUA Server
    function (callback) {
        var userIdentity = null; // anonymous
        if (argv.userName && argv.password) {

            userIdentity = {
                userName: argv.userName,
                password: argv.password
            };

        }
        client.createSession(userIdentity, function (err, session) {
            if (!err) {
                the_session = session;
                console.log(" session created".yellow);
                console.log(" sessionId : ", session.sessionId.toString());
            }
            callback(err);
        });
    },

    /*
       @author ascatox 
        Use "-browse option"
        Browse the OPCUA Server Address Space ObjectsFolder to find the Devices and the Variables to listen.
        Configuration is present in config file "browseServerOptions" section.
        Creation of contexts to listen and methods to invoke inside the server. 
      
     */
    function (callback) {
        if (doBrowse) {
            the_session.browse(config.browseServerOptions.mainFolderToBrowse, function (err, browse_result) {
                if (!err) {
                    var configObj = config.browseServerOptions.mainObjectStructure;
                    browse_result.forEach(function (result) {
                        result.references.forEach(function (reference) {
                            var name = reference.browseName.toString();
                            if (name.indexOf(configObj.namePrefix) > -1) {
                                var contextObj = {
                                    id: name,
                                    type: config.defaultType,
                                    mappings: [],
                                    active: [], //only active USED in this version
                                    lazy: [],
                                    commands: []
                                };
                                the_session.browse(reference.nodeId, function (err, browse_result_sub) {
                                    browse_result_sub.forEach(function (resultSub) {
                                        resultSub.references.forEach(function (referenceChild) {
                                            var nameChild = referenceChild.browseName.toString();
                                            if (nameChild.indexOf(configObj.variableType1.nameSuffix) > -1
                                                ||
                                                nameChild.indexOf(configObj.variableType2.nameSuffix) > -1) {
                                                var type = nameChild.indexOf(configObj.variableType1.nameSuffix) > -1
                                                    ? configObj.variableType1.type : configObj.variableType2.type;
                                                var contextMeasureObj = {
                                                    ocb_id: nameChild,
                                                    opcua_id: referenceChild.nodeId.toString(),
                                                    type: type
                                                };
                                                var attributeObj = {
                                                    name: nameChild,
                                                    type: type
                                                }
                                                contextObj.mappings.push(contextMeasureObj);
                                                contextObj.active.push(attributeObj);
                                            } else if (nameChild.indexOf(configObj.methodNameSuffix) > -1) {
                                                var method = {
                                                    objectId: reference.nodeId,
                                                    methodId: referenceChild.nodeId.toString(),
                                                    name: nameChild
                                                };
                                                methods.push(method);
                                            }
                                        });
                                    });
                                });
                                contexts.push(contextObj);
                            }
                        });
                    });
                }
                callback(err);
            });
        } else {
            contexts = config.contexts;
            callback();
        }
    },

    // ----------------------------------------
    // display namespace array
    function (callback) {
        var server_NamespaceArray_Id = opcua.makeNodeId(opcua.VariableIds.Server_NamespaceArray); // ns=0;i=2006
        the_session.readVariableValue(server_NamespaceArray_Id, function (err, dataValue, diagnosticsInfo) {

            console.log(" --- NAMESPACE ARRAY ---");
            if (!err) {
                var namespaceArray = dataValue.value.value;
                for (var i = 0; i < namespaceArray.length; i++) {
                    console.log(" Namespace ", i, "  : ", namespaceArray[i]);
                }
            }
            console.log(" -----------------------");
            callback(err);
        });
    },

    //------------------------------------------
    // crawl the address space, display as a hierarchical tree rooted in ObjectsFolder
    function (callback) {
        if (doCrawling) {
            var nodeCrawler = new NodeCrawler(the_session);

            var t = Date.now();
            var t1;
            client.on("send_request", function () {
                t1 = Date.now();
            });
            client.on("receive_response", function () {
                var t2 = Date.now();
                var str = util.format("R= %d W= %d T=%d t= %d", client.bytesRead, client.bytesWritten, client.transactionsPerformed, (t2 - t1));
                console.log(str.yellow.bold);
            });

            t = Date.now();
            var nodeId = "ObjectsFolder";
            console.log("now crawling object folder ...please wait...");
            nodeCrawler.read(nodeId, function (err, obj) {
                if (!err) {
                    treeify.asLines(obj, true, true, function (line) {
                        console.log(line);
                    });
                }
                callback(err);
            });
        } else {
            callback();
        }
    },

    //------------------------------------------
    // initialize all subscriptions
    function (callback) {
        contexts.forEach(function (context) {
            console.log('registering OCB context ' + context.id+" of type "+ context.type);
            var device = {
                id: context.id,
                type: context.type,
                active: config.types[context.type].active, //only active used in this VERSION
                lazy: context.lazy,
                commands: context.commands
            };
            try {
                iotAgentLib.register(device, function (err) {
                    if (err) { // skip context
                        console.log("could not register OCB context " + context.id + "".red.bold);
                        console.log(JSON.stringify(err).red.bold);
                    } else { // init subscriptions
                        console.log("registered successfully OCB context " + context.id);
                        context.mappings.forEach(function (mapping) {
                            initSubscriptionBroker(context, mapping);
                        });
                    }
                });
            } catch (err) {
                console.log("error registering OCB context".red.bold);
                console.log(JSON.stringify(err).red.bold);
                callback();
                return;
            }
        });
        callback();
    },
    /*
           @author ascatox
           Use "-browse option" 
           I'm trying to implement communication from OCB to IOT Agent
           by subscriptions to default Context
    */
    function (callback) {
        if (doBrowse) {
            var attributeTriggers = [];
            config.contextSubscriptions.forEach(function (cText) {
                cText.mappings.forEach(function (map) {
                    attributeTriggers.push(map.ocb_id);
                });
            });

            config.contextSubscriptions.forEach(function (context) {
                console.log('subscribing OCB context ' + context.id + " for attributes: ");
                attributeTriggers.forEach(function (attr) {
                    console.log("attribute name: " + attr + "".cyan.bold);
                });
                var device = {
                    id: context.id,
                    name: context.id,
                    type: context.type,
                    service: config.service,
                    subservice: config.subservice
                };
                try {
                    iotAgentLib.subscribe(device, attributeTriggers,
                        attributeTriggers, function (err) {
                            if (err) {
                                console.log('There was an error subscribing device [%s] to attributes [%j]'.bold.red,
                                    device.name, attributeTriggers);
                            } else {
                                console.log('Successfully subscribed device [%s] to attributes[%j]'.bold.yellow,
                                    device.name, attributeTriggers);
                            }
                            callback();
                        });
                } catch (err) {
                    console.log('There was an error subscribing device [%s] to attributes [%j]',
                        device.name, attributeTriggers);
                    console.log(JSON.stringify(err).red.bold);
                    callback();
                    return;
                }
            });
        } else {
            callback();
        }
    },

    //------------------------------------------
    // set up a timer that shuts down the client after a given time
    function (callback) {
        console.log("Starting timer ", timeout);
        var timerId;
        if (timeout > 0) {
            timerId = setTimeout(function () {
                terminateAllSubscriptions();
                // TODO don't know if this approach may be broken (see commented code below)
                // but let's assume it won't matter anyway as we are shutting down...
                callback();
                //the_subscription.once("terminated", function() {
                //    callback();
                //});
                //the_subscription.terminate();
            }, timeout);
        } else if (timeout == -1) {
            //  Infinite activity
            console.log("NO Timeout set!!!".bold.cyan);

        } else {
            callback();
        }
    },

    //------------------------------------------
    // when the timer goes off, we first close the session...
    function (callback) {
        console.log(" closing session");
        the_session.close(function (err) {
            console.log(" session closed", err);
            callback();
        });
    },

    // ...and finally the the connection
    function (callback) {
        console.log(" Calling disconnect");
        client.disconnect(callback);
    }

], function (err) {

    // this is called whenever a step call callback() passing along an err object
    console.log(" disconnected".cyan);

    if (err) {
        console.log(" client : process terminated with an error".red.bold);
        console.log(" error", err);
        console.log(" stack trace", err.stack);
    } else {
        console.log("success !!   ");
    }
    // force disconnection
    if (client) {
        client.disconnect(function () {
            var exit = require("exit");
            console.log("Exiting");
            exit();
        });
    }

});

// not much use for this...
process.on("error", function (err) {
    console.log(" UNTRAPPED ERROR", err.message);
});

// handle CTRL+C
var user_interruption_count = 0;
process.on('SIGINT', function () {

    console.log(" user interruption ...");

    user_interruption_count += 1;
    if (user_interruption_count >= 3) {
        process.exit(1);
    }

    console.log(" Received client interruption from user ".red.bold);
    console.log(" shutting down ...".red.bold);
    terminateAllSubscriptions();
    disconnect();
});





//LAZY GAB
function queryContextHandler(id, type, service, subservice, attributes, callback) {


    contextSubscriptions.forEach(function (contextSubscription) {
    if (contextSubscription.id===id){
        contextSubscription.mappings.forEach(function (mapping) {
            
            attributes.forEach(function (attribute) {
            if (attribute===mapping.ocb_id){
                the_session.readVariableValue(mapping.opcua_id, function(err,dataValue) {
                    if (!err) {
                        console.log(" letto variabile % = " , dataValue.toString());
                    }
                    callback(err, createResponse(id, type, attributes, ""+dataValue.value.value));
                  
                });
            }
        });
        });
    }
    });

   
    
    
    
    
    
    
    /* var options = {
        url: 'http://127.0.0.1:9999/iot/d',
        method: 'GET',
        qs: {
            q: attributes.join()
        }
    };

    request(options, function (error, response, body) {
        logger.error('TESTGABR queryContextHandler');

        if (error) {
            logger.error('TESTGABR errore');

            callback(error);
        } else {
            logger.error('TESTGABR no errore');

            callback(null, createResponse(id, type, attributes, body));
        }
    });
    */
}

function createResponse(id, type, attributes, body) {

    var values = body.split(','),
        responses = [];

    for (var i = 0; i < attributes.length; i++) {
        responses.push({
                name: attributes[i],
                type: "string",
                value: values[i]
        });
    }

    return {
        id: id,
        type: type,
        attributes: responses
    };
}


function updateContextHandler(id, type, service, subservice, attributes, callback) {
    


      
    

    
   
/*
    var options = {
        url: 'http://127.0.0.1:9999/iot/d',
        method: 'GET',
        qs: {
            d: createQueryFromAttributes(attributes)
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            callback(null, {
                id: id,
                type: type,
                attributes: attributes
            });
        }
    });*/
}


function createQueryFromAttributes(attributes) {


    var query = "";

    for (var i in attributes) {
        query += attributes[i].name + '|' + attributes[i].value;

        if (i != attributes.length -1) {
            query += ',';
        }
    }

    return query;
}


function commandContextHandler(id, type, service, subservice, attributes, callback) {
   // console.log(context, 'TESTGABR commandContextHandler');

  


    contextSubscriptions.forEach(function (contextSubscription) {
      
        if (contextSubscription.id===id){

            contextSubscription.mappings.forEach(function (mapping) {
                attributes.forEach(function (attribute) {
                if (attribute.name===mapping.ocb_id){
                    
                    var input=mapping.inputArguments;
                    if (input!=null){

                    var i=0;
                    input.forEach(function (inputType) {
                        inputType["value"]=attribute.value[i++];
                    });
                     }
                    var methodsToCall = [];
                    methodsToCall.push({
                        objectId: ""+mapping.object_id,
                        methodId: ""+mapping.opcua_id,
                        /*inputArguments: [{
                            dataType: dataType.UInt32,
                            arrayType: VariantArrayType.arrayType,
                            value:  [2,2] }
                        ] */
                        inputArguments: input/*[
                            {
                                dataType: opcua.dataType.UInt32,
                                type: "nbBarks",
                                value:  2 },
                            {
                                dataType: opcua.dataType.UInt32,
                                type: "volume",
                                value:  2 
                            }
                        ]*///OK
                    });
                    console.log("method to call ="+JSON.stringify(methodsToCall));
                    the_session.call(methodsToCall,function(err,results){
                       // results.length.should.eql(1);
                       // results[0].statusCode.should.eql(StatusCodes.Good);
                       
                        callback(err, {
                            id: id,
                            type: type,
                            attributes: attributes
                        });

                       
                        contexts.forEach(function (context) {
                        iotAgentLib.getDevice(context.id, context.service, context.subservice, function (err, device) {
                            if (err) {
                                console.log("could not find the OCB context " + context.id + "".red.bold);
                                console.log(JSON.stringify(err).red.bold);
                                executeUpdateValues(device, id, type, service, subservice, attributes, "ERROR", "generic error", callback);

                            } else {
                               // setTimeout(function() { 
                                   

                                   if (results[0].statusCode.name===opcua.StatusCodes.Bad.name)
                                        executeUpdateValues(device, id, type, service, subservice, attributes, "ERROR", results[0].outputArguments[0].value, callback);
                                   else{
                                       if (results[0].outputArguments[0]!==undefined)
                                             executeUpdateValues(device, id, type, service, subservice, attributes, "OK", results[0].outputArguments[0].value, callback);
                                   }
                
                
                             //   }, 30000);
                
                
                            }
                            });
                        
                
                    });
                    });


                   
                }
            });
            });
        }
        });
    













   
    
  
   
}
//iotAgentLib.setDataUpdateHandler(updateContextHandler);
iotAgentLib.setDataQueryHandler(queryContextHandler);
iotAgentLib.setCommandHandler(commandContextHandler)
//END GAB LAZY



/**
 * Retrieve the Device that corresponds to a Context Update, and execute the update side effects
 * if there were any (e.g.: creation of attributes related to comands).
 *
 * @param {String} device           Object that contains all the information about the device.
 * @param {String} id               Entity ID of the device to find.
 * @param {String} type             Type of the device to find.
 * @param {String} service          Service of the device.
 * @param {String} subservice       Subservice of the device.
 * @param {Array}  attributes       List of attributes to update with their types and values.
 */
function executeUpdateValues(device, id, type, service, subservice, attributes, status, value, callback) {
    var sideEffects = [];
    if (device.commands) {
        for (var i = 0; i < device.commands.length; i++) {
            for (var j = 0; j < attributes.length; j++) {
                if (device.commands[i].name === attributes[j].name) {
                    var newAttributes = [
                        {
                            name: device.commands[i].name + '_status',
                            type: constants.COMMAND_STATUS,
                            value: status
                        },
                        {
                            name: device.commands[i].name + '_info',
                            type: constants.COMMAND_RESULT,
                            value: value
                        }
                    ];

                    sideEffects.push(
                        async.apply(ngsi.update,
                            device.id,
                            device.resource,
                            device.apikey,
                            newAttributes,
                            device
                        )
                    );
                }
            }
        }
    }


    async.series(sideEffects,  function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    });
}
}




}
catch(ex){
    console.log(ex)
    console.log("Generic error: closing application...".red);
    process.exit(1);
}
