var opcua = require("node-opcua");

try{
    var config = require('./config.json');
}
catch(ex){
    console.log(ex)
    console.log("Configuration not found...closing application...".red);
    process.exit(1);
}
module.exports = config;




/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */


 /* ORIGINAL
var config = {
    logLevel: 'DEBUG',
    contextBroker: {
        host: '192.168.90.103',
        port: '1026'
    },
    server: {
        port: 4041,
        host: '0.0.0.0'
    },
    authentication: {
        host: 'localhost',
        port: '5000',
        user: 'iotagent',
        password: 'iotagent'
    },
    deviceRegistry: {
        type: 'memory'
    },
    types: {
        'Light': {
            url: '/',
            apikey: '',
            type: 'Light',
            // service: '',
            // subservice: '',
            // trust: ''
            // cbHost: '',
            commands: [],
            lazy: [
                {
                    name: 'luminescence',
                    type: 'Lumens'
                }
            ],
            active: [
                {
                    name: 'status',
                    type: 'Boolean'
                }
            ]
        }
    },
    service: 'smartGondor',
    subservice: '/gardens',
    providerUrl: 'http://192.168.56.1:4041',
    deviceRegistrationDuration: 'P1M',
    defaultType: 'Thing'
};

module.exports = config;
END ORIGINAL*/
/*
var config = {
    //May take one of the following values: DEBUG, INFO, ERROR, FATAL.
    logLevel: 'DEBUG',
    contextBroker: {
        host: '192.168.90.103',
        port: '1026'
    },
    //
    //Porta di ascolto come Context Provider
    //Ci potrebbe essere anche il parametro baseRoot (prefisso base per i vari path)
    //
    server: {
        port: 4041
    },
    //memory o mongodb per la memorizzazione dei device (mongo per renderla persistente)
    deviceRegistry: {
        type: 'memory'
    },
    types: {},
    
    //This two parameters are needed to fill the fiware-service and fiware-servicepath mandatory headers that will be used in the interactions with the Context Broker
    //Service default utilizzato laddove non ci siano info di service nei device data nè associate al tipo
    service: 'howtoService',
    //Subservice default utilizzato laddove non ci siano info di service nei device data nè associate al tipo
    subservice: '/howto',
    //Ip esterno agent --> dove il CB invia le risposte
    providerUrl: 'http://localhost:4041',
    //duration of the registrations as Context Providers (1 mese per es.)
    deviceRegistrationDuration: 'P1M',
    defaultType: 'Thing'
};

module.exports = config;

*/