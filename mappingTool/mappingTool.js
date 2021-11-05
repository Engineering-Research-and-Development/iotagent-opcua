module.exports = {
    mappingTool: function(userName, password, endpoint, properties) {
        var logger = require('logops');
        var opcua = require('node-opcua');
        const fs = require('fs');
        var path = require('path');
        var nodesCrawler = require('./nodesCrawler');

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

        //check if OPCUA Server endpoint exists
        if (endpoint.length === 0) {
            logger.error('No endpoint specified.');
            process.exit(1);
        }
        logger.info('Welcome to ENGINEERING INGEGNERIA INFORMATICA FIWARE OPC UA AGENT MAPPING TOOL');

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

        async function mappingToolrun() {
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
                    console.log('crawling   -> ', reference.browseName.toString(), reference.nodeId.toString());

                    const crawler = new opcua.NodeCrawler(mySession);

                    const data = await crawler.read(reference.nodeId.toString());

                    nodesCrawler.nodesCrawler(data);
                }

                /* 
              // step 4 : read a variable with readVariableValue
                  const dataValue2 = await mySession.readVariableValue("ns=3;s=Speed");
                  console.log(" value = " , dataValue2.toString());
          
              // step 4' : read a variable with read
                  const maxAge = 0;
                  const nodeToRead = {
                    nodeId: "ns=3;s=Speed",
                    attributeId: opcua.AttributeIds.Value
                  };
                  const dataValue =  await mySession.read(nodeToRead, maxAge);
                  console.log(" value " , dataValue.toString());*/

                // step 6: finding the nodeId of a node by Browse name
                /*   const browsePath = opcua.makeBrowsePath("RootFolder", "/Objects/Server.ServerStatus.BuildInfo.ProductName");
              
                  const result = await mySession.translateBrowsePath(browsePath);
                  const productNameNodeId = result.targets[0].targetId;
                  console.log(" Product Name nodeId = ", productNameNodeId.toString());*/

                // close session
                await mySession.close();

                // disconnecting
                await myClient.disconnect();
                console.log('done !');
            } catch (err) {
                console.log('An error has occured : ', err);
            }
        }
        mappingToolrun();
    }
};
