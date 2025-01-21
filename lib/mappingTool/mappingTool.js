/*
 * Copyright 2022 Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opcua
 *
 * iotagent-opcua is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-opcua is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-opcua.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[manfredi.pistone@eng.it, gabriele.deluca@eng.it, walterdomenico.vergara@eng.it, mattiagiuseppe.marzano@eng.it]
 */

/* eslint-disable no-unused-vars */

const path = require('path');
const opcua = require('node-opcua');
const opcuaTypes = require('node-opcua-types');
const nodeCrawler = require('node-opcua-client-crawler');
const fs = require('fs');
const os = require('os');
const config = require('../configService');
const context = {
    op: 'IoTAgentOPCUA.OPCUAMappingTool'
};

async function mappingTool(configJS) {
    const nodesCrawler = require('./nodesCrawler');
    const companionRecognition = require('./companionRecognition');
    const smartDataModelCrawler = require('./smartDataModelCrawler');

    let configJson = {};

    const opcUAClientOptions = {
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

    const certificateFolder = path.join(process.cwd(), '/certificates');
    const certificateFile = path.join(certificateFolder, 'server_certificate.pem');

    const certificateManager = new opcua.OPCUACertificateManager({
        rootFolder: certificateFolder,
        name: ''
    });
    await certificateManager.initialize();

    const privateKeyFile = certificateManager.privateKey;
    if (!fs.existsSync(certificateFile)) {
        await certificateManager.createSelfSignedCertificate({
            subject: '/CN=localhost/O=Engineering Ingegneria Informatica S.p.A./L=Palermo',
            startDate: new Date(),
            dns: [],
            validity: 365 * 5,
            applicationUri: `urn:${os.hostname()}:NodeOPCUA-Client`,
            outputFile: certificateFile
        });
    }

    const resolvedCertificateFilePath = path.resolve(certificateFile).replace(/\\/g, '/');
    const resolvedPrivateKeyFilePath = path.resolve(privateKeyFile).replace(/\\/g, '/');
    opcUAClientOptions.certificateFile = resolvedCertificateFilePath;
    opcUAClientOptions.privateKeyFile = resolvedPrivateKeyFilePath;
    opcUAClientOptions.clientCertificateManager = certificateManager;
    const myClient = opcua.OPCUAClient.create(opcUAClientOptions);

    //check if OPCUA Server endpoint exists
    if (configJS.opcua.endpoint.length === 0) {
        config.getLogger().error('No endpoint specified.');
        process.exit(1);
    }
    config.getLogger().info(context, 'Welcome to ENGINEERING INGEGNERIA INFORMATICA FIWARE OPC UA AGENT MAPPING TOOL');

    async function mappingToolRun() {
        try {
            configJson.types = {};
            configJson.contexts = [];
            configJson.contextSubscriptions = [];

            // step 1 : connect to
            await myClient.connect(configJS.opcua.endpoint);
            config.getLogger().info(context, 'connected !');

            const username = configJS.opcua.username;
            const password = configJS.opcua.password;
            var userIdentity = null;

            if (username && password) {
                userIdentity = {
                    userName: username,
                    password: password,
                    type: opcuaTypes.UserTokenType.UserName
                };
            }

            // step 2 : createSession
            const the_session = await myClient.createSession(userIdentity);
            config.getLogger().info(context, 'session created !');

            // step 3 : browse
            const browseResult = await the_session.browse('RootFolder');

            //step 4: OPCUA Companion Recognition
            const nsArray = await the_session.readNamespaceArray();

            const templateList = await companionRecognition.companionRecognition(the_session);
            let companionRecognized = false;
            let smartDataModel = '';
            for (const model of templateList) {
                if (nsArray.toString().toLowerCase().includes(model.toString().split('.')[0].toLowerCase())) {
                    config.getLogger().info(context, 'Companion recognized ==> ' + model.toString().split('.')[0] + ' <==');
                    companionRecognized = true;
                    smartDataModel = model;
                }
            }

            // mappingTool "companion"
            if (companionRecognized) {
                config.getLogger().info(context, 'Reading Smart Data Model: ' + smartDataModel);
                //configJson = await smartDataModelCrawler.smartDataModelCrawler(smartDataModel);
                await smartDataModelCrawler.smartDataModelCrawler(configJS, smartDataModel, configJson);
            } else {
                // mappingTool "standard"
                for (const reference of browseResult.references) {
                    config.getLogger().info(context, 'crawling   -> ', reference.browseName.toString(), reference.nodeId.toString());
                    if (reference.browseName.toString() === 'Objects') {
                        const crawler = new nodeCrawler.NodeCrawler(the_session);
                        const data = await crawler.read(reference.nodeId.toString());
                        configJson = await nodesCrawler.nodesCrawler(the_session, data, crawler, configJS, configJson);
                    }
                }
            }

            // close session
            await the_session.close();

            // disconnecting
            await myClient.disconnect();
            config.getLogger().info(context, 'disconnected !');

            //config.getLogger().info(context, 'config.json --> \n', JSON.stringify(configJson));
        } catch (err) {
            config.getLogger().info(context, 'An error has occured : ', err);
        }
    }
    await mappingToolRun();

    if (config.getConfig().mappingTool.storeOutput) {
        const configFolder = path.join(process.cwd(), '/conf');
        const configFile = path.join(configFolder, 'config_mapping_tool.json');
        fs.writeFile(configFile, JSON.stringify(configJson, null, 4), 'utf8', function (err) {
            if (err) {
                config.getLogger().warn('An error occured while saving config_mapping_tool.json');
                return;
            }
            config.getLogger().info('config_mapping_tool.json has been saved successfully.');
        });
    }
    return configJson;
}

exports.mappingTool = mappingTool;
