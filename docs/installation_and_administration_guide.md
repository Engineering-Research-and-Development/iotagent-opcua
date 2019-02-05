# OPC UA Agent Installation & Administration Guide

### NPM Install

#### Download

Firstly, download git source project

```bash
git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua"
```

#### Install

Then, launch npm install process in order to download and install all dependencies.

```bash
cd iotagent-opcua
npm install
```

#### Run

Finally, run the agent.

```bash
node index.js
```

---

### Docker Install

You do need to have docker in your machine. See the [documentation](https://docs.docker.com/installation/) on how to do
this.

#### 1. The Fastest Way

Docker Compose allows you to link an OPC UA Agent container to a MongoDB container in a few minutes. This method
requires that you install [Docker Compose](https://docs.docker.com/compose/install/).

Follow these steps:

1.  Create a directory on your system on which to work (for example, `~/opc-ua-agent`).
2.  Create a new file called `docker-compose.yml` inside your directory with the following contents:

```yaml
   version: "2.3"
   services:

      iotage:
         hostname: iotage
         image: rdlabengpa/opcuaage:latest
         networks:
            - hostnet
            - iotnet
         ports:
            - "4001:4001"
            - "4081:8080"
      depends_on:
         - iotmongo
      volumes:
         - ./AGECONF:/opt/iotagent-opcua/conf

      iotmongo:
         hostname: iotmongo
         image: mongo:3.4
         networks:
            - iotnet
         volumes:
            - iotmongo_data:/data/db
            - iotmongo_conf:/data/configdb

   volumes:
         iotmongo_data:
         iotmongo_conf:

   networks:
         hostnet:
         iotnet:
```

3.  Using the command-line and within the directory you created type: `sudo docker-compose up`.

Before running containers you must create an AGECONF subdirectory in the same directory as the docker-compose.yml file
and create in it a config.properties file based on the following template:

```text
namespace-ignore=2
context-broker-host=<ORIONHOSTIP>
context-broker-port=<ORIONPORT>
server-base-root=/
server-port=4001
device-registry-type=memory
mongodb-host=iotmongo
mongodb-port=27017
mongodb-db=iotagent
mongodb-retries=5
mongodb-retry-time=5
fiware-service=<SERVICE>
fiware-service-path=<SERVICE-PATH>
provider-url=http://iotage:4001
device-registration-duration=P1M
endpoint=opc.tcp://<IPADDR>:<PORT>
log-level=DEBUG

#DATATYPE MAPPING OPCUA --> NGSI
OPC-datatype-Number=Number
OPC-datatype-Decimal128=Number
OPC-datatype-Double=Number
OPC-datatype-Float=Number
OPC-datatype-Integer=Integer
OPC-datatype-UInteger=Integer
OPC-datatype-String=Text
OPC-datatype-ByteString=Text
#END DATATYPE MAPPING OPCUA --> NGSI

#SESSION PARAMETERS
requestedPublishingInterval=500
requestedLifetimeCount=1000
requestedMaxKeepAliveCount=5
maxNotificationsPerPublish=10
publishingEnabled=true
priority=10

#SERVER CERT E AUTH
securityMode=NONE
securityPolicy=
userName=
password=

#Administration Services
api-port=4081
#End Administration Services

#POLL COMMANDS SETTINGS
polling=false
polling-commands-timer=30000
pollingDaemonFrequency=20000
pollingExpiration=200000
#END POLL COMMANDS SETTINGS

#AGENT ID
agent-id=<PREFIX>
```

You can set the properties according to your environment, but you should focus at least on:

```text
context-broker-host=<ORIONHOSTIP>
context-broker-port=<ORIONPORT>

fiware-service=<SERVICE>
fiware-service-path=<SERVICE-PATH>

endpoint=opc.tcp://<IPADDR>:<PORT>

agent-id=<PREFIX>
```

#### 2. Alternative Start Method

The docker-compose is the preferred method for starting multiple containers and creating related resources, but
alternatively you can use the following commands:

```bash
docker run -d --name iotmongo -h iotmongo -v iotmongo_data:/data/db -v iotmongo_conf:/data/configdb mongo:3.4
```

```bash
docker run -d --name iotage -h iotage -p 4001:4001 -p 4081:8080 --link iotmongo -v ./AGECONF:/opt/iotagent-opcua/conf rdlabengpa/opcuaage:latest
```
