try{
  // node-opcue dependencies
  require("requirish")._(module);
  var constants = require('iotagent-node-lib');
  var treeify = require('treeify');
  var _ = require("underscore");
  var util = require("util");
  var ngsi = require('iotagent-node-lib');
  //var crawler = require('./node_modules/node-opcua/lib/client/node_crawler.js');
  var async = require("async");
  var opcua = require("node-opcua");
  var dataType = opcua.DataType;
  var VariantArrayType = opcua.VariantArrayType;
  var NodeCrawler = opcua.NodeCrawler;
  // iotagent-node-lib dependencies
  var iotAgentLib = require('iotagent-node-lib');
  var userIdentity = null; // anonymous
  var prompt = require('prompt');
  var request = require('request');
  var cfc = require('./iot_agent_modules/cleanForbiddenCharacters');

  var mG = require('./iot_agent_modules/run/mongoGroup');
  var rSfN = require ('./iot_agent_modules/run/removeSuffixFromName');
  var tAs = require ('./iot_agent_modules/run/terminateAllSubscriptions');
  var disconnect = require('./iot_agent_modules/run/disconnect');
  var cM = require('./iot_agent_modules/run/callMethods');
  var fT = require('./iot_agent_modules/run/findType');
  var cR = require('./iot_agent_modules/run/createResponse');
  var eUv = require('./iot_agent_modules/run/executeUpdateValues');


  var argv = require('yargs')
  .wrap(132)
  //.usage('Usage: $0 -d --endpoint <endpointUrl> [--securityMode (NONE|SIGNANDENCRYPT|SIGN)] [--securityPolicy (None|Basic256|Basic128Rsa15)] ')
  //.demand("endpoint")
  //.string("endpoint")
  //.describe("endpoint", "the end point to connect to ")
  /*
  .string("securityMode")
  .describe("securityMode", "the security mode")

  .string("securityPolicy")
  .describe("securityPolicy", "the policy mode")

  .string("userName")
  .describe("userName", "specify the user name of a UserNameIdentityToken ")

  .string("password")
  .describe("password", "specify the password of a UserNameIdentityToken")
  */
  .string("timeout")
  .describe("timeout", " the timeout of the session in second =>  (-1 for infinity)")

  .string("debug")
  .describe("debug", " display more verbose information")

  .string("browse")
  .describe("browse", " browse Objects from opc-ua server. Fulfill browseServerOptions section in config file")

  //.alias('e', 'endpoint')
  //.alias('s', 'securityMode')
  //.alias('P', 'securityPolicy')
  //.alias("u", 'userName')
  //.alias("p", 'password')
  .alias("t", 'timeout')
  .alias("d", "debug")
  .alias("b", "browse")

  .argv;

  var fs = require('fs');
  var logContext = {
    comp: 'iotAgent-OPCUA',
    op: 'Index',
    srv: '',
    subsrv: ''
  };




  // custom simple logger
  var logger = require('logops');
  logger.format = logger.formatters.pipe;

  // Specify the context fields to omit as an array
  var PropertiesReader = require('properties-reader');
  var properties = PropertiesReader('./conf/config.properties');
  // fully qualified name
  var endpointUrl = properties.get('endpoint');
  var securityMode = properties.get('securityMode');
  var securityPolicy = properties.get('securityPolicy');
  var userName = properties.get('userName');
  var password = properties.get('password');



  if (endpointUrl==null){
    logger.info(logContext,"/conf/config.properties: endpoint not found...".red);

    process.exit(1);
  }



  var doAuto = false;

  if (fs.existsSync('./conf/config.json')) {
    var config = require('./conf/config.json');
  }
  else{
    doAuto = true;
  }


  if (doAuto){
    logContext.op="Index.MappingTool";
    logger.info(logContext,'----------------    MAPPING TOOL    ----------------');

    var loadingBar;
    loadingBar=setInterval(function(){  process.stdout.write('.'); }, 3000);

    var exec = require('child_process').exec;
    try {

      if(userName!=0 && password!=0)
      {
        var cmdjava = 'java -jar mapping_tool.jar  -e '+endpointUrl+' -f conf/config.properties' + ' -u ' + userName + ' -p ' + password;
      }
      else {
        var cmdjava = 'java -jar mapping_tool.jar  -e '+endpointUrl+' -f conf/config.properties' ;
      }
      var child = exec(cmdjava, function(err, stdout, stderr) {
        clearInterval(loadingBar);
        if (err) {
          logger.error(logContext,"\nThere is a problem with automatic configuration. Loading old configuration (if exists)...".red);

        }else{
          logger.info(logContext,"\nAutomatic configuration successfully created. Loading new configuration...".cyan);

        }
        run();
      }

    );
  } catch (ex) {
    clearInterval(loadingBar);
    logger.info(logContext,"\nThere is a problem with automatic configuration. Loading old configuration (if exists)...".red);

  }
  module.exports = child;
}else{
  run();
}
//Clean Orion Forbidden Chars

function run(){
  logContext.op="Index.Initialize";
  logger.info(logContext,'----------------------------------------------------');

  // configuration of iotagent-node-lib
  var config = require('./conf/config');

  var sMode = opcua.MessageSecurityMode.get(securityMode || "NONE");
  console.log("sMode"+sMode);
  if (!sMode) {
    throw new Error("Invalid Security mode , should be " + opcua.MessageSecurityMode.enums.join(" "));
  }

  var sPolicy = opcua.SecurityPolicy.get(securityPolicy || "None");
  if (!sPolicy) {
    throw new Error("Invalid securityPolicy , should be " + opcua.SecurityPolicy.enums.join(" "));
  }

  var timeout = parseInt(argv.timeout) * 1000 || -1; //604800*1000; //default 20000
  var doBrowse = argv.browse ? true : false;


  logger.info(logContext,"endpointUrl         = ".cyan, endpointUrl);
  logger.info(logContext,"securityMode        = ".cyan, securityMode.toString());
  logger.info(logContext,"securityPolicy      = ".cyan, securityPolicy.toString());
  logger.info(logContext,"timeout             = ".cyan, timeout ? timeout : " Infinity ");
  // set to false to disable address space crawling: might slow things down if the AS is huge
  var doCrawling = argv.crawl ? true : false;
  var client = null;
  var the_session = null;
  var the_subscriptions = [];
  var contexts = [];



  




  //Getting contextSubscriptions configuration
  var contextSubscriptions = config.contextSubscriptions;
  var methods = [];


  function initSubscriptionBroker(context, mapping) {
    logContext.op="Index.InitSubscriptions";
    // TODO this stuff too should come from config
    var parameters = {
      requestedPublishingInterval: properties.get('requestedPublishingInterval'),
      requestedLifetimeCount: properties.get('requestedLifetimeCount'),
      requestedMaxKeepAliveCount: properties.get('requestedMaxKeepAliveCount'),
      maxNotificationsPerPublish: properties.get('maxNotificationsPerPublish'),
      publishingEnabled: properties.get('publishingEnabled'),
      priority: properties.get('priority')
    };
    var subscription = new opcua.ClientSubscription(the_session, parameters);

    function getTick() {
      return Date.now();
    }

    var t = getTick();

    subscription.on("started", function () {

      logger.info(logContext,"started subscription: ",
      subscription.subscriptionId);
      logger.info(logContext," revised parameters ");
      logger.info(logContext,"  revised maxKeepAliveCount  ",
      subscription.maxKeepAliveCount, " ( requested ",
      parameters.requestedMaxKeepAliveCount + ")");
      logger.info(logContext,"  revised lifetimeCount      ",
      subscription.lifetimeCount, " ( requested ",
      parameters.requestedLifetimeCount + ")");
      logger.info(logContext,"  revised publishingInterval ",
      subscription.publishingInterval, " ( requested ",
      parameters.requestedPublishingInterval + ")");
      logger.info(logContext,"  suggested timeout hint     ",
      subscription.publish_engine.timeoutHint);

    }).on("internal_error", function (err) {

      logger.error(logContext,"received internal error".red.bold);
      logger.info(JSON.stringify(err).red.bold);

    }).on("keepalive", function () {
      logContext.op="Index.keepaliveSubscriptionBroker";
      var t1 = getTick();
      var span = t1 - t;
      t = t1;
      var keepAliveString="keepalive "+ span / 1000 + " "+ "sec"+ " pending request on server = "+
      subscription.publish_engine.nbPendingPublishRequests + "";
      logger.info(logContext,keepAliveString.gray);

    }).on("terminated", function (err) {

      if (err) {
        logger.error(logContext,"could not terminate subscription: " + subscription.subscriptionId + "".red.bold);
        logger.info(logContext,JSON.stringify(err).red.bold);
      } else {
        logger.info(logContext,"successfully terminated subscription: " + subscription.subscriptionId);
      }

    });

    the_subscriptions.push(subscription);

    logger.info(logContext,"initializing monitoring: " + mapping.opcua_id);

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
      logger.info(logContext,"started monitoring: " + monitoredItem.itemToMonitor.nodeId.toString());
    });

    monitoredItem.on("changed", function (dataValue) {
      logContext.op="Index.Monitoring";
      var variableValue = null;

      if (dataValue.value && dataValue.value != null)
      variableValue = dataValue.value.value || null;


      variableValue=cfc.cleanForbiddenCharacters(variableValue);
      if (variableValue==null){
        ;

      }else{

        logger.info(logContext,monitoredItem.itemToMonitor.nodeId.toString(), " value has changed to " + variableValue + "".bold.yellow);
        iotAgentLib.getDevice(context.id, context.service, context.subservice, function (err, device) {
          if (err) {
            logger.error(logContext,"could not find the OCB context " + context.id + "".red.bold);
            logger.info(logContext,JSON.stringify(err).red.bold);
          } else {
            /* WARNING attributes must be an ARRAY */
            var attributes = [{
              name: mapping.ocb_id,
              type: mapping.type || fT.findType(mapping.ocb_id,device),
              value: variableValue,
            }];

            //Setting ID withoput prefix
            iotAgentLib.update(device.id, device.type, '', attributes, device, function (err) {
              if (err) {
                logger.error(logContext,"error updating " + mapping.ocb_id + " on " + device.name + "".red.bold);

                logger.info(logContext,JSON.stringify(err).red.bold);
              } else {
                logger.info(logContext,"successfully updated " + mapping.ocb_id + " on " + device.name);
              }
            });
          }
        });
      }
    });

    monitoredItem.on("err", function (err_message) {
      logger.error(monitoredItem.itemToMonitor.nodeId.toString(), " ERROR".red, err_message);
    });
  }

  function notificationHandler(device, updates, callback) {
    logger.info(logContext,"Data coming from OCB: ".bold.cyan, JSON.stringify(updates));
    cM.callMethods(updates[0].value,methods,the_session); //TODO gestire multiple chiamate
  }
  // each of the following steps is executed in due order
  // each step MUST call callback() when done in order for the step sequence to proceed further
  async.series([
    //------------------------------------------
    // initialize client connection to the OCB
    function (callback) {
      iotAgentLib.activate(config, function (err) {
        if (err) {
          logger.error(logContext,'There was an error activating the Agent: ' + err.message);
          rSfN.removeSuffixFromName.exit(1);
        } else {
          logger.info(logContext,"NotificationHandler attached to ContextBroker");
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
        defaultSecureTokenLifetime: 400000,
        //keepSessionAlive: true,
        requestedSessionTimeout: 100000, // very long 100 seconds
        connectionStrategy: {
          maxRetry: 10,
          initialDelay: 2000,
          maxDelay: 10*1000
        }
      };



      logger.info(logContext,"Options = ", options.securityMode.toString(), options.securityPolicy.toString());

      client = new opcua.OPCUAClient(options);

      logger.info(logContext," connecting to ", endpointUrl.cyan.bold);

      client.connect(endpointUrl, callback);


      client.on("connection_reestablished", function () {
        logger.info(logContext," !!!!!!!!!!!!!!!!!!!!!!!!  CONNECTION RESTABLISHED !!!!!!!!!!!!!!!!!!!");

      });

      client.on( "after_reconnection", function (err) {
        logger.info(logContext, " ... reconnection process has been completed: ", err );
      } );

      client.on( "close", function ( err ) {
          logger.info(logContext, " Check Security Settings ".red.bold, err );
      } );

      client.on("backoff", function(nb, delay) {
        logger.info(logContext,"  connection failed for the", nb,
        " time ... We will retry in ", delay, " ms");
      });

      client.on("start_reconnection", function () {
        logger.info(logContext,"start_reconnection not working so aborting");
      });
    },

    //------------------------------------------
    // initialize client session on the OPCUA Server
    function (callback) {
      userIdentity = null; // anonymous
      if (userName && password) {

        userIdentity = {
          userName: userName,
          password: password
        };

      }
      client.createSession(userIdentity, function (err, session) {
        if (!err) {
          the_session = session;
          logger.info(logContext," session created".yellow);
          logger.info(logContext," sessionId : ", session.sessionId.toString());
          logger.info(logContext," the timeout value set by the server is ",  session.timeout ," ms");
        }
        callback(err);
      });
    },

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

        logger.info(logContext," --- NAMESPACE ARRAY ---");
        if (!err) {
          var namespaceArray = dataValue.value.value;
          for (var i = 0; i < namespaceArray.length; i++) {
            logger.info(logContext," Namespace ", i, "  : ", namespaceArray[i]);
          }
        }
        logger.info(logContext," -----------------------");
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
          logger.info(logContext,str.yellow.bold);
        });

        t = Date.now();
        var nodeId = "ObjectsFolder";
        logger.info(logContext,"now crawling object folder ...please wait...");
        nodeCrawler.read(nodeId, function (err, obj) {
          if (!err) {
            treeify.asLines(obj, true, true, function (line) {
              logger.info(logContext,line);
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
      //Creating group always
      if (config.deviceRegistry.type=="mongodb"){
        mG.mongoGroup(config);
        request(optionsCreation, function(error, response, body) {
          if (error){
            logger.error(logContext,"CREATION GROUP ERROR. Verify OCB connection.");
            return;
          }
          else  {
            logger.info(logContext,"GROUPS SUCCESSFULLY CREATED!");
          }
        });
      }

      contexts.forEach(function (context) {
        logger.info(logContext,'registering OCB context ' + context.id+" of type "+ context.type);
        logContext.srv=context.service;
        logContext.subsrv=context.subservice;

        var device = {
          id: context.id,
          name: context.id,
          type: context.type,
          active: config.types[context.type].active, //only active used in this VERSION
          lazy: context.lazy,
          commands: context.commands,
          service: context.service,
          subservice: context.subservice,
          polling: context.polling
        };
        try {


          iotAgentLib.register(device, function (err) {

            if (err) { // skip context
              logger.error(logContext,"could not register OCB context " + context.id + "".red.bold);
              logger.info(logContext,JSON.stringify(err).red.bold);
              context.mappings.forEach(function (mapping) {
                initSubscriptionBroker(context, mapping);
              });
            } else { // init subscriptions
              logger.info(logContext,"registered successfully OCB context " + context.id);
              context.mappings.forEach(function (mapping) {
                initSubscriptionBroker(context, mapping);
              });
            }
          });
        } catch (err) {
          logger.error(logContext,"error registering OCB context".red.bold);
          logger.info(logContext,JSON.stringify(err).red.bold);
          callback();
          return;
        }
      });
      callback();
    },

    function (callback) {
      if (doBrowse) {
        var attributeTriggers = [];
        config.contextSubscriptions.forEach(function (cText) {
          cText.mappings.forEach(function (map) {
            attributeTriggers.push(map.ocb_id);
          });
        });

        config.contextSubscriptions.forEach(function (context) {
          logger.info(logContext,'subscribing OCB context ' + context.id + " for attributes: ");
          attributeTriggers.forEach(function (attr) {
            logger.info(logContext,"attribute name: " + attr + "".cyan.bold);
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
                  logger.error(logContext,'There was an error subscribing device [%s] to attributes [%j]'.bold.red,
                  device.name, attributeTriggers);
                } else {
                  logger.info(logContext,'Successfully subscribed device [%s] to attributes[%j]'.bold.yellow,
                  device.name, attributeTriggers);
                }
                callback();
              });
            } catch (err) {
              logger.error(logContext,'There was an error subscribing device [%s] to attributes [%j]',
              device.name, attributeTriggers);
              logger.info(logContext,JSON.stringify(err).red.bold);
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
        logger.info(logContext,"Starting timer ", timeout);
        var timerId;
        if (timeout > 0) {
          timerId = setTimeout(function () {
            tAs.terminateAllSubscriptions(the_subscriptions);
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
          logger.info(logContext,"NO Timeout set!!!".bold.cyan);

        } else {
          callback();
        }
      },
      //------------------------------------------
      // when the timer goes off, we first close the session...
      function (callback) {
        logger.info(logContext," closing session");
        the_session.close(function (err) {
          logger.info(logContext," session closed", err);
          callback();
        });
      },

      // ...and finally the the connection
      function (callback) {
        logger.info(logContext," Calling disconnect");
        client.disconnect(callback);
      }
    ], function (err) {

      // this is called whenever a step call callback() passing along an err object
      logger.error(logContext," disconnected".cyan);

      if (err) {
        logger.error(logContext," client : process terminated with an error".red.bold);
        logger.error(logContext," error", err);
        logger.error(logContext," stack trace", err.stack);
      } else {
        logger.info(logContext,"success !!   ");
      }
      // force disconnection
      if (client) {
        client.disconnect(function () {
          var exit = require("exit");
          logger.info(logContext,"Exiting");

          exit();
        });
      }
    });

    // not much use for this...
    process.on("error", function (err) {
      logger.error(logContext," UNTRAPPED ERROR", err.message);
    });

    // handle CTRL+C
    //var user_interruption_count = 0;

    process.on('SIGINT', function () {

      logger.error(logContext," user interruption ...");
      logger.info(logContext," Received client interruption from user ".red.bold);
      logger.info(logContext," shutting down ...".red.bold);
      tAs.terminateAllSubscriptions(the_subscriptions);
      if(the_session!=null && client !=null)
        disconnect.disconnect(the_session,client);
      process.exit(1);
    });


    //Lazy Attributes handler
    function queryContextHandler(id, type, service, subservice, attributes, callback) {

      logContext.op="Index.QueryContextHandler";

      contextSubscriptions.forEach(function (contextSubscription) {
        if (contextSubscription.id===id){
          contextSubscription.mappings.forEach(function (mapping) {



            async.forEachSeries(attributes, function(attribute, callback2) {

              if (attribute===mapping.ocb_id){

                the_session.readVariableValue(mapping.opcua_id, function(err,dataValue) {
                  logger.info(logContext,"dataValue.value.value="+dataValue.value.value)
                  if (!err) {
                    logger.info(logContext," read variable % = " , dataValue.toString());
                  }


                  callback(err, cR.createResponse(id, type, attributes, ""+dataValue.value.value));
                });
              }


            }, null);
          });
        }
      });
    }

    /*
    function updateContextHandler(id, type, service, subservice, attributes, callback) {
  }*/

  function commandContextHandler(id, type, service, subservice, attributes, callback) {

    logContext.op="Index.CommandContextHandler";


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

                inputArguments: input
              });
              logger.info(logContext,"method to call ="+JSON.stringify(methodsToCall));
              the_session.call(methodsToCall,function(err,results){

                callback(err, {
                  id: id,
                  type: type,
                  attributes: attributes
                });

                contexts.forEach(function (context) {
                  iotAgentLib.getDevice(context.id, context.service, context.subservice, function (err, device) {
                    if (err) {
                      logger.error(logContext,"could not find the OCB context " + context.id + "".red.bold);
                      logger.info(logContext,JSON.stringify(err).red.bold);
                      eUv.executeUpdateValues(device, id, type, service, subservice, attributes, "ERROR", "generic error", callback);

                    } else {

                      if (results[0].statusCode.name===opcua.StatusCodes.Bad.name)
                      eUv.executeUpdateValues(device, id, type, service, subservice, attributes, "ERROR", results[0].outputArguments[0].value, callback);
                      else{
                        if (results[0].outputArguments[0]!==undefined)
                        eUv.executeUpdateValues(device, id, type, service, subservice, attributes, "OK", results[0].outputArguments[0].value, callback);
                      }
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
  iotAgentLib.setCommandHandler(commandContextHandler);

  var handlerCalled = false;



}
}
catch(ex){
  var logger = require('logops');

  logger.error(ex)
  logger.error(logContext,"Generic error: closing application...".red);
  process.exit(1);
}
