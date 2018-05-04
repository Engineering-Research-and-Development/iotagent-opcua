### Install 
Firstly, launch npm install process in order to download and install all dependencies.
```
npm install
```
### Configure

#### Auto Configuration (using of Mapping Tool)
Then, configure the properties file in order to set parameters about North side (Context Broker), agent server and South side (OPC UA endpoint).
```
#SOUTHBOUND CONFIGURATION (OPC-UA)
#Namespace to ignore
namespace-ignore=2,7
#OPC-UA Endpoint
endpoint=opc.tcp://localhost:4334/UA/MillingMachine

#NORTHBOUND CONFIGURATION (ORION CB)
context-broker-host=192.168.56.101
context-broker-port=1026
fiware-service=opcua
fiware-service-path=/boost

#AGENT SERVER CONFIGURATION
server-base-root=/
server-port=4041
device-registry-type=memory
provider-url=http://192.168.56.1:4041
device-registration-duration=P1M
log-level=INFO
#MongoDB Agent Config
mongodb-host=192.168.56.101
mongodb-port=27017
mongodb-db=iotagent
mongodb-retries=5
mongodb-retry-time=5
```
Using of Auto Configuration create a mapping for all OPC-UA objects (except those with namespace to ignore matching): all OPC-UA variables will be configured as active attributes whereas all OPC-UA methods will be configured as commands. It is possible modify configuration output (config.json file in same path) manually in order to drop some attributes/command or add lazy attributes. 

#### Manual Configuration (editing confi.json file)
```
{  
   "logLevel":"DEBUG",
   "contextBroker":{  
      "host":"localhost",
      "port":1026
   },
   "server":{  
      "port":4041,
      "baseRoot":"/"
   },
   "deviceRegistry":{  
      "type":"mongodb"
   },
   "mongodb":{  
      "host":"localhost",
      "port":"27017",
      "db":"iotagent",
      "retries":5,
      "retryTime":5
   },
   "types":{  
      "MyDevice":{  
         "service":"opcua",
         "subservice":"/testserver1",
         "active":[  
            {  
               "name":"temperature",
               "type":"Double"
            },
            {  
               "name":"humidity",
               "type":"Double"
            }
         ],
         "lazy":[  

         ],
         "commands":[  
            {  
               "name":"Start",
               "type":"command"
            },
            {  
               "name":"Reset",
               "type":"command"
            }
         ]
      }
   },
   "browseServerOptions":null,
   "service":"opcua",
   "subservice":"/testserver1",
   "providerUrl":"http://192.168.22.98:4041",
   "deviceRegistrationDuration":"P1M",
   "defaultType":null,
   "contexts":[  
      {  
         "id":"MyDevice",
         "type":"MyDevice",
         "service":"opcua",
         "subservice":"/testserver1",
         "mappings":[  
            {  
               "ocb_id":"temperature",
               "opcua_id":"ns=1;s=Temperature",
               "object_id":null,
               "inputArguments":[  

               ]
            },
            {  
               "ocb_id":"humidity",
               "opcua_id":"ns=1;s=Humidity",
               "object_id":null,
               "inputArguments":[  

               ]
            }
         ]
      },
   ],
   "contextSubscriptions":[  
      {  
         "id":"MyDevice",
         "type":"MyDevice",
         "mappings":[  
            {  
               "ocb_id":"Start",
               "opcua_id":"ns=1;s=Start",
               "object_id":"ns=1;i=1004",
               "inputArguments":[  
                  {  
                     "dataType":7,
                     "type":"volume"
                  }
               ]
            },
            {  
               "ocb_id":"Reset",
               "opcua_id":"ns=1;s=Reset",
               "object_id":"ns=1;i=1004",
               "inputArguments":[  

               ]
            }
         ]
      }
   ]
}
```

### Run
Finally, run the agent.
```
node index.js
```
