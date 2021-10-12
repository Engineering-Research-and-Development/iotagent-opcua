module.exports = {
    mappingTool: function(userName, password, endpoint, properties) {
        var logger = require('logops');
        var opcua = require('node-opcua');
        const fs = require('fs');
        var path = require('path');

        //check if OPCUA Server endpoint exists
        if (endpoint.length === 0) {
            logger.error('No endpoint specified.');
            process.exit(1);
        }
        logger.info('Welcome to ENGINEERING INGEGNERIA INFORMATICA FIWARE OPC UA AGENT MAPPING TOOL');

        var mySession = null;

        var options = {
            endpointMustExist: false,
            securityMode: properties.get('securityMode'),
            securityPolicy: properties.get('securityPolicy'),
            defaultSecureTokenLifetime: 400000,
            keepSessionAlive: true,
            requestedSessionTimeout: 100000, // very long 100 seconds
            connectionStrategy: {
                maxRetry: 10,
                initialDelay: 2000,
                maxDelay: 10 * 1000
            }
        };
        var myClient = opcua.OPCUAClient.create(options);
        var certificateFile = './certificates/client_certificate.pem';
        var privateKeyFile = './certificates/client_private_key.pem';

        if (
            properties.get('securityMode') != 'None' &&
            properties.get('securityPolicy') != 'None' &&
            fs.existsSync(certificateFile) &&
            fs.existsSync(privateKeyFile)
        ) {
            // certificate and private key needed
            options['certificateFile'] = path.resolve(__dirname, certificateFile.replace(/\\/g, '/'));
            options['privateKeyFile'] = path.resolve(__dirname, privateKeyFile.replace(/\\/g, '/'));
        }
        /*
        // OPCUA-IoTAgent acts as OPCUA Client
        myClient = opcua.OPCUAClient.create(options);
        logger.info(' connecting to ', endpoint);
        myClient.connect(endpoint);
            
        console.log(myClient);*/

        async function main() {
            try {
                // step 1 : connect to
                await myClient.connect(endpoint);
                console.log('connected !');

                // step 2 : createSession
                const mySession = await myClient.createSession();
                console.log('session created !');

                // step 3 : browse
                const browseResult = await mySession.browse('RootFolder');

                console.log('references of RootFolder :');
                for (const reference of browseResult.references) {
                    console.log('   -> ', reference.browseName.toString());
                }

                /*
              // step 4 : read a variable with readVariableValue
                  const dataValue2 = await session.readVariableValue("ns=3;s=Scalar_Simulation_Double");
                  console.log(" value = " , dataValue2.toString());
          
              // step 4' : read a variable with read
                  const maxAge = 0;
                  const nodeToRead = {
                    nodeId: "ns=3;s=Scalar_Simulation_String",
                    attributeId: AttributeIds.Value
                  };
                  const dataValue =  await session.read(nodeToRead, maxAge);
                  console.log(" value " , dataValue.toString());
          
              // step 5: install a subscription and install a monitored item for 10 seconds
              const subscription = ClientSubscription.create(session, {
                  requestedPublishingInterval: 1000,
                  requestedLifetimeCount:      100,
                  requestedMaxKeepAliveCount:   10,
                  maxNotificationsPerPublish:  100,
                  publishingEnabled: true,
                  priority: 10
              });
              
              subscription.on("started", function() {
                  console.log("subscription started for 2 seconds - subscriptionId=", subscription.subscriptionId);
              }).on("keepalive", function() {
                  console.log("keepalive");
              }).on("terminated", function() {
                 console.log("terminated");
              });
              
              
              // install monitored item
              
              const itemToMonitor: ReadValueIdLike = {
                  nodeId: "ns=3;s=Scalar_Simulation_Float",
                  attributeId: AttributeIds.Value
              };
              const parameters: MonitoringParametersOptions = {
                  samplingInterval: 100,
                  discardOldest: true,
                  queueSize: 10
              };
              
              const monitoredItem  = ClientMonitoredItem.create(
                  subscription,
                  itemToMonitor,
                  parameters,
                  TimestampsToReturn.Both
              );
              
              monitoredItem.on("changed", (dataValue: DataValue) => {
                 console.log(" value has changed : ", dataValue.value.toString());
              });
              
              
              
              async function timeout(ms: number) {
                  return new Promise(resolve => setTimeout(resolve, ms));
              }
              await timeout(10000);
              
              console.log("now terminating subscription");
              await subscription.terminate();
              
              
          
              // step 6: finding the nodeId of a node by Browse name
                  const browsePath = makeBrowsePath("RootFolder", "/Objects/Server.ServerStatus.BuildInfo.ProductName");
              
                  const result = await session.translateBrowsePath(browsePath);
                  const productNameNodeId = result.targets[0].targetId;
                  console.log(" Product Name nodeId = ", productNameNodeId.toString());
          */
                // close session
                await mySession.close();

                // disconnecting
                await myClient.disconnect();
                console.log('done !');
            } catch (err) {
                console.log('An error has occured : ', err);
            }
        }
        main();
    }
};
