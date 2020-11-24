## Connecting the OPC UA IoTAgent to an external OPC UA Server

In this section you find all what you need to know about linking the OPC UA IoTAgent to an external OPC UA Server.

## Step 1 - Configure the Agent

First of all, you have to inform the Agent of where it can find the other components. IP addresses, hostnames, ports and
all the other required properties must be specified within `AGECONF/config.properties` file.

![edit config.properties](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/images/OPC%20UA%20agent%20flow%20chart_1.png?raw=true)

This is how `config.properties` looks like:

```text
## SOUTHBOUND CONFIGURATION (OPC UA)
namespace-ignore=2,7
endpoint=opc.tcp://iotcarsrv:5001/UA/CarServer

## NORTHBOUND CONFIGURATION (ORION CONTEXT BROKER)
context-broker-host=orion
context-broker-port=1026
fiware-service=opcua_car
fiware-service-path=/demo


## AGENT SERVER CONFIGURATION
server-base-root=/
server-port=4001
provider-url=http://iotage:4001

device-registration-duration=P1M
device-registry-type=memory

log-level=DEBUG

namespaceIndex=3
namespaceNumericIdentifier=1000

# MONGO-DB CONFIGURATION (required if device-registry-type=mongodb)
mongodb-host=iotmongo
mongodb-port=27017
mongodb-db=iotagent
mongodb-retries=5
mongodb-retry-time=5

## DATATYPE MAPPING OPCUA --> NGSI
OPC-datatype-Number=Number
OPC-datatype-Decimal128=Number
OPC-datatype-Double=Number
OPC-datatype-Float=Number
OPC-datatype-Integer=Integer
OPC-datatype-UInteger=Integer
OPC-datatype-String=Text
OPC-datatype-ByteString=Text

## SESSION PARAMETERS
requestedPublishingInterval=10
requestedLifetimeCount=1000
requestedMaxKeepAliveCount=10
maxNotificationsPerPublish=100
publishingEnabled=true
priority=10

## MONITORING PARAMETERS
samplingInterval=1
queueSize=10000
discardOldest=false

## SERVER CERT E AUTH
securityMode=1
securityPolicy=0
userName=
password=

#securityMode=SIGNANDENCRYPT
#securityMode=1Basic256
#password=password1
#userName=user1

#api-ip=192.168.13.153

## ADMINISTRATION SERVICES
api-port=8080

## POLL COMMANDS SETTINGS
polling=false
polling-commands-timer=30000
pollingDaemonFrequency=20000
pollingExpiration=200000

## AGENT ID
agent-id=age01_
entity-id=age01_Car # used only during tests

## CONFIGURATION
configuration=api

## CHECK TIMER POLLING DEVICES
checkTimer=2000
```

As you can see the file is organized in sections, below we include, for each section, the most relevant properties you
should consider:

```yaml
# Southbound configuration
# The OPC UA Objects available within the specified namespaces will not be mapped by the OPC UA IotAgent.
namespace-ignore=2,7
# OPC UA Server address
endpoint=opc.tcp://<IPADDR>:<PORT>

# Northbound configuration
# These are important for identifying the Device location and will be useful
# when contacting the Orion Context Broker requesting values or methods execution.
context-broker-host=<ORIONHOSTIP>
context-broker-port=<ORIONPORT>
fiware-service=<SERVICE>
fiware-service-path=<SERVICE-PATH>

# Agent Server Configuration
device-registry-type=memory|mongodb
agent-id=<PREFIX>

# The identifiers of the namespace the nodes belong to
namespaceIndex=3
namespaceNumericIdentifier=1000


# Session and monitoring parameters
# These parameters are the homonymous counterparts of OPC UA official ones.
# See OPC UA Documentation for further information
```

If you are using the dockerized version, you do not have to change the hostnames/port pairs, we will see how to map that
symbolic names to actual IP addresses in the next section.

## Step 2 - Map IP addresses

When using an external OPC UA Server the `docker-compose-external-server.yml` file must be used. Unlike
`docker-compose.yml` file (testbed) the CarServer section has clearly been removed.

Now, the Agent (and the built-in mapping tool) needs to know the address of the OPC UA Server. You have to map the OPC
UA Server address against two hostnames.

Open the `docker-compose-external-server.yml` file:

```yaml
services:
  iotage:
    ...
    extra_hosts:
      - "iotcarsrv:<opc-ua-car-server-IP-ADDRESS>"
      - "<opc-ua-server-hostname>:<opc-ua-car-server-IP-ADDRESS>"
    ...
```

The first line of `extra_hosts` section is used by the Agent during the communication with the OPC UA Server. The second
one is needed when the OPC UA Server answers to the mapping tool returning its hostname.

## Step 3 - Preparing the Agent for start up

-   Erase the default empty `config.json` (this will be created by the mapping tool)
-   Comment the "configuration=api" line inside `config.properties` file

## Step 4 - Run the Agent

```bash
docker-compose down -v
```

Assuming the OPC UA Server is running, execute:

```bash
docker-compose -f docker-compose-external-server.yml up -d
```

At Agent start up time the mapping tool will be invoked and OPC UA variables will be configured as active attributes
whereas all OPC UA methods will be configured as commands. It is possible modify configuration output (config.json file
in same path) manually in order to drop some attributes/command, add lazy attributes and enable the command polling.

This schema depicts what happens after executing the above command

![OPC UA Agent flow](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/images/OPC%20UA%20agent%20flow%20chart_3.png?raw=true)

#### Manual Configuration (editing config.json file)

To define active attributes:

-   set the active object in active section array of type object
-   set the mapping object in mappings array of contexts

To define lazy attributes:

-   set the lazy object in lazy section array of type object
-   set the mapping object in mappings array of contextSubscriptions (set object_id to null and inputArguments to empty
    array)

To define commands attributes:

-   set the command object in commands section array of type object
-   set the mapping object in mappings array of contextSubscriptions (object_id is the parent object of the method)

To define poll commands:

-   set polling to true to enable or to false to disable poll commands
-   set polling Daemon Frequency and Expiration in ms
-   set polling-commands-timer in ms to execute che poll commands automatically

In order to clarify, see the following example:

```json
{
    "logLevel": "INFO",
    "contextBroker": {
        "host": "192.168.56.101",
        "port": 1026
    },
    "server": {
        "port": 4041,
        "baseRoot": "/"
    },
    "deviceRegistry": {
        "type": "memory"
    },
    "mongodb": {
        "host": "192.168.56.101",
        "port": "27017",
        "db": "iotagent",
        "retries": 5,
        "retryTime": 5
    },
    "types": {
        "Car": {
            "service": "opcua_car",
            "subservice": "/demo",
            "active": [
                {
                    "name": "Engine_Temperature",
                    "type": "Number"
                },
                {
                    "name": "Engine_Oxigen",
                    "type": "Number"
                }
            ],
            "lazy": [
                {
                    "name": "Speed",
                    "type": "Number"
                }
            ],
            "commands": [
                {
                    "name": "Stop",
                    "type": "command"
                },
                {
                    "name": "Accelerate",
                    "type": "command"
                }
            ]
        }
    },
    "browseServerOptions": null,
    "service": "opcua_car",
    "subservice": "/demo",
    "providerUrl": "http://192.168.56.1:4041",
    "pollingExpiration": "200000",
    "pollingDaemonFrequency": "20000",
    "deviceRegistrationDuration": "P1M",
    "defaultType": null,
    "contexts": [
        {
            "id": "Car_1",
            "type": "Car",
            "service": "opcua_car",
            "subservice": "/demo",
            "polling": "false",
            "mappings": [
                {
                    "ocb_id": "Engine_Temperature",
                    "opcua_id": "ns=1;s=Temperature",
                    "object_id": null,
                    "inputArguments": []
                },
                {
                    "ocb_id": "Engine_Oxigen",
                    "opcua_id": "ns=1;s=Oxigen",
                    "object_id": null,
                    "inputArguments": []
                }
            ]
        }
    ],
    "contextSubscriptions": [
        {
            "id": "Car",
            "type": "Car",
            "mappings": [
                {
                    "ocb_id": "Stop",
                    "opcua_id": "ns=1;s=Stop",
                    "object_id": "ns=1;i=1000",
                    "inputArguments": []
                },
                {
                    "ocb_id": "Accelerate",
                    "opcua_id": "ns=1;s=Accelerate",
                    "object_id": "ns=1;i=1000",
                    "inputArguments": [
                        {
                            "dataType": 7,
                            "type": "Intensity"
                        }
                    ]
                },
                {
                    "ocb_id": "Speed",
                    "opcua_id": "ns=1;s=Speed",
                    "object_id": null,
                    "inputArguments": []
                }
            ]
        }
    ]
}
```

## Security

According to the OPC UA Security Model the OPC UA IotAgent, acting as an OPC UA Client, can specify a "Security Policy"
and a "Security Mode". Nevertheless, these requests must find a match with the OPC UA Server policies.

You can specify the Security Policy/Mode pair through the `config.properties` file, and in particular by modifying this
section:

```yaml
## SERVER CERT E AUTH
securityMode=None securityPolicy=None userName= password=
```

Allowed values for `securityPolicy` are:

-   None
-   Basic128
-   Basic192
-   Basic192Rsa15
-   Basic256Rsa15
-   Basic256Sha256
-   Aes128_Sha256_RsaOaep
-   PubSub_Aes128_CTR
-   PubSub_Aes256_CTR
-   Basic128Rsa15
-   Basic256

Allowed values for `securityMode` are:

-   None
-   Sign
-   SignAndEncrypt

In the `docker-compose.yml` you find a `certificates` volume inside the `iotage` section. The `certificates` folder
contains two files `client_certificate.pem` and `client_private_key.pem`: overwrite them with yours.
