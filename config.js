var opcua = require("node-opcua");


var config = {
    logLevel: 'DEBUG',
    contextBroker: {
        host: '192.168.22.125',
        port: 1026  
    },
    server: {
        port: 4041
        //host: '192.168.22.160'
    },
    deviceRegistry: {
        type: 'memory'
    },

    types: {  //mappatura tra nome e tipo SOLO ACTIVE 
        'Room': {
            service: 'opcua',
            subservice: '/testserver',
            active: [

                {
                    name: 'pressure',
                    type: 'Integer'
                },
                {
                    name: 'temperature',
                    type: 'float'
                },
                {
                    name: 'attrib3',
                    type: 'string'
                }

            ],
            lazy: [ {
                name: 'humidity',
                type: 'float'
            },
            {
                name: 'free_memory',
                type: 'float'
            }],
            commands: [
                {
                    "name": "bark",
                    "type": "command"
                  }
            ]
        }
    },
    //browse funziona solo con l'ultima versione --> serve un server che simula il mondo whr (sta in ascolto su una particolare cartella di OPCUA)
    //WARNING Used only with "-browse" option
    browseServerOptions: {
        mainFolderToBrowse: "ObjectsFolder",
        mainObjectStructure: {
            namePrefix: "TestStation", //devices
            variableType1: {
                nameSuffix: "Measure",
                type: "integer"
            },
            variableType2: {
                nameSuffix: "State",
                type: "string"
            },
            methodNameSuffix: "Method"
        }
    },
    //END WARNING Used only with "-browse" option
    //servono a Orion come partizionamento di contesto (schema e subschema) es. se utilizziamo un CB per diverse aziende nome azienda/stabilimento
    service: 'opcua',
    subservice: '/testserver',
    //non ci serve endpoint passato ad Orion per notificare i cambiamenti
    providerUrl: 'http://192.168.22.160:4041', //'http://4769258e.ngrok.io'
    //durano un mese le subscrition su Orion (indicare dove orion manda le notifiche info di cambiamento su un contesto o un attributo di un contesto)
    deviceRegistrationDuration: 'P1M',
    //metterlo a chiodo su ogni contesto: è il tipe del device che diventerà il type del contesto
    defaultType: 'Room',

    /* start of custom section for OPC UA mapping */
    /* WARNING Not considered with "-browse" option, built from Server Address Space*/
    contexts: [
        {
            id: 'Room11', //id del contesto NORTH
            type: 'Room', //type del contesto (es. temperature Measuere) NORTH
            service: 'opcua',
            subservice: '/testserver',
            mappings: [
                {
                    ocb_id: 'pressure', //name nodo
                    opcua_id: 'ns=1;s=PumpSpeed' //name variabile
                },
                {
                    ocb_id: 'temperature',
                    opcua_id: 'ns=1;s=Temperature'
                }/*
                {
                    ocb_id: 'humidity',
                    opcua_id: 'ns=1;s=Humidity'
                }*/
            ]
        },
        {
            id: 'Room12',
            type: 'Room',
            service: 'opcua',
            subservice: '/testserver',
            mappings: [
                {
                    ocb_id: 'temperature',
                    opcua_id: 'ns=2;s=Temperature'
                }
            ]
        }
    ],
    // WARNING Used only with "-browse" option
    // Orion Subscriptions to Contexts
    // start of custom section for OPC UA mapping OCB -> Agent
   
    //Non ci serve --> da un contesto arrivo sulla macchina da NORTH A SOUTH
    contextSubscriptions: [
        {
            id: 'Room11',
            type: 'Room',
            mappings: [
                {
                    ocb_id: 'humidity',
                    opcua_id: 'ns=1;s=Humidity'
                }
            ]
        },
        {
            id: 'Room12',
            type: 'Room',
            mappings: [
                {
                    ocb_id: 'bark',
                    opcua_id: 'ns=1;s=Bark',
                    object_id: 'ns=1;i=1003',
                    inputArguments: [
                        {
                            dataType: opcua.DataType.UInt32,
                            type: "nbBarks"
                        },
                        {
                            dataType: opcua.DataType.UInt32,
                            type: "volume"
                        }
                    ]
                },
                {
                    ocb_id: 'free_memory',
                    opcua_id: 'ns=1;s=free_memory'
                }
            ]
        }
    ]
   // WARNING Used only with "-browse" option
};

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