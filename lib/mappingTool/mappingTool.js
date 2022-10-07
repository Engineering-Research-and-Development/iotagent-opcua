const { constructBrowsePathFromQualifiedName } = require('node-opcua');
const { config } = require('yargs');

module.exports = {
    mappingTool: async function (configJS) {
        var logger = require('logops');
        var opcua = require('node-opcua');
        const fs = require('fs').promises;
        var path = require('path');
        var nodesCrawler = require('./nodesCrawler');
        var companionRecognition = require('./companionRecognition');
        var smartDataModelCrawler = require('./smartDataModelCrawler');

        var configJson = {};

        var mySession = null;
        var options = {
            endpointMustExist: false,
            securityMode: configJS.opcua.securityMode,
            securityPolicy: configJS.opcua.securityPolicy,
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
        var certificateFile = '../../certificates/client_certificate.pem';
        var privateKeyFile = '../../certificates/client_private_key.pem';

        //check if OPCUA Server endpoint exists
        if (configJS.opcua.endpoint.length === 0) {
            logger.error('No endpoint specified.');
            process.exit(1);
        }
        logger.info('Welcome to ENGINEERING INGEGNERIA INFORMATICA FIWARE OPC UA AGENT MAPPING TOOL');

        if (configJS.opcua.securityMode != 'None' && configJS.opcua.securityPolicy != 'None' && fs.existsSync(certificateFile) && fs.existsSync(privateKeyFile)) {
            // certificate and private key needed
            options['certificateFile'] = path.resolve(__dirname, certificateFile.replace(/\\/g, '/'));
            options['privateKeyFile'] = path.resolve(__dirname, privateKeyFile.replace(/\\/g, '/'));
        }

        async function mappingToolrun() {
            try {
                configJson['types'] = {};
                configJson['contexts'] = [];
                configJson['contextSubscriptions'] = [];

                // step 1 : connect to
                await myClient.connect(configJS.opcua.endpoint);
                console.log('connected !');

                // step 2 : createSession
                const mySession = await myClient.createSession();
                console.log('session created !');

                // step 3 : browse
                const browseResult = await mySession.browse('RootFolder');

                //step 4: OPCUA Companion Recognition
                const nsArray = await mySession.readNamespaceArray();

                const templateList = await companionRecognition.companionRecognition(mySession);
                var companionRecognized = false;
                var smartDataModel = '';
                for (const model of templateList) {
                    if (nsArray.toString().toLowerCase().includes(model.toString().split('.')[0].toLowerCase())) {
                        console.log('Companion recognized ==> ' + model.toString().split('.')[0] + ' <==');
                        companionRecognized = true;
                        smartDataModel = model;
                    }
                }

                // mappingTool "companion"
                if (companionRecognized) {
                    console.log('Reading Smart Data Model: ' + smartDataModel);
                    //configJson = await smartDataModelCrawler.smartDataModelCrawler(smartDataModel);
                    await smartDataModelCrawler.smartDataModelCrawler(configJS, smartDataModel, configJson);
                } else {
                    // mappingTool "standard"
                    for (const reference of browseResult.references) {
                        console.log('crawling   -> ', reference.browseName.toString(), reference.nodeId.toString());
                        if (reference.browseName.toString() == 'Objects') {
                            const crawler = new opcua.NodeCrawler(mySession);
                            const data = await crawler.read(reference.nodeId.toString());
                            configJson = await nodesCrawler.nodesCrawler(mySession, data, crawler, configJS, configJson);
                        }
                    }
                }

                // close session
                await mySession.close();

                // disconnecting
                await myClient.disconnect();
                console.log('disconnected !');

                //console.log('config.json --> \n', JSON.stringify(configJson));
            } catch (err) {
                console.log('An error has occured : ', err);
            }
        }
        await mappingToolrun();

        return configJson;
    }
};
