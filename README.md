# F4I OPC UA Agent

[![FIWARE IoT Agents](https://nexus.lab.fiware.org/static/badges/chapters/iot-agents.svg)](https://www.fiware.org/developers/catalogue/)
[![License: AGPL](https://img.shields.io/github/license/Engineering-Research-and-Development/iotagent-opcua.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Docker badge](https://img.shields.io/docker/pulls/rdlabengpa/opcuaage.svg)](https://hub.docker.com/r/rdlabengpa/opcuaage/)
[![Support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/iot-agents.svg)](https://stackoverflow.com/questions/tagged/fiware+iot)
<br/> [![Documentation badge](https://img.shields.io/readthedocs/iotagent-opcua.svg)](https://iotagent-opcua.rtfd.io/)
[![Build badge](https://img.shields.io/travis/Engineering-Research-and-Development/iotagent-opcua.svg)](https://travis-ci.org/Engineering-Research-and-Development/iotagent-opcua/)
[![Coverage Status](https://coveralls.io/repos/github/Engineering-Research-and-Development/iotagent-opcua/badge.svg?branch=master)](https://coveralls.io/github/Engineering-Research-and-Development/iotagent-opcua?branch=master)
![Status](https://nexus.lab.fiware.org/static/badges/statuses/iot-openmtc.svg)
[![Join the chat at https://gitter.im/iotagent-opcua/community](https://badges.gitter.im/iotagent-opcua/community.svg)](https://gitter.im/iotagent-opcua/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Known Vulnerabilities](https://snyk.io/test/github/Engineering-Research-and-Development/iotagent-opcua/badge.svg)](https://snyk.io/test/github/Engineering-Research-and-Development/iotagent-opcua)
<br/> An Internet of Things Agent accepting data from OPC UA devices. This IoT Agent is designed to be a bridge between
the OPC Unified Architecture protocol and the
[NGSI](https://swagger.lab.fiware.org/?url=https://raw.githubusercontent.com/Fiware/specifications/master/OpenAPI/ngsiv2/ngsiv2-openapi.json)
interface of a context broker.

The intended level of complexity to support these operations should consider a limited human intervention (mainly during
the setup of a new OPC UA endpoint), through the mean of a parametrization task (either manual or semi-automatic, using
a text-based parametrization or a simple UI to support the configuration) so that no software coding is required to
adapt the agent to different OPC UA devices.

It is based on the [IoT Agent Node.js Library](https://github.com/telefonicaid/iotagent-node-lib). Further general
information about the FIWARE IoT Agents framework, its architecture and the common interaction model can be found in the
library's GitHub repository.

This project is part of [FIWARE](https://www.fiware.org/). For more information check the FIWARE Catalogue entry for the
[IoT Agents](https://github.com/Fiware/catalogue/tree/master/iot-agents).

| :books: [Documentation](https://iotagent-opcua.rtfd.io) | :whale: [Docker Hub](https://hub.docker.com/r/rdlabengpa/opcuaage) | :dart: [Roadmap](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/roadmap.md) |
| ------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |


## Contents

-   [Background](#background)
-   [Install](#install)
-   [Usage](#usage)
-   [API](#api)
-   [Testing](#testing)
-   [Quality Assurance](#quality-assurance)
-   [License](#license)

## Background

### Positioning in the overall F4I Reference Architecture

The F4I OPC UA Agent is based on the reference implementation of the FIWARE Backend Device Management Generic Enabler,
IDAS, delivered by Telefonica I+D. IDAS provides a collection of Agents - i.e., independent processes that are typically
executed in the proximity of IoT devices and that are responsible for bridging a specific IoT protocol to the NGSI
standard (e.g. the IDAS distribution includes off-the-shelf Agents for LwM2M and MQTT). To this end, IDAS links the NGSI
southbound API of the FIWARE Orion Context Broker to the northbound API of the IoT application stack, by providing a
software library (the IoT Agent Lib depicted in the previous figure) for developing custom Agents that may extend the
bridging capabilities of IDAS to other protocols. The F4I IDAS OPC UA Agent makes use of this framework to integrate OPC
UA-based devices in a publish-subscribe system based on the FIWARE Orion Context Broker.

## Install

### NPM Install

```console
$ npm install
$ node index.js
```

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
################ OPTIONAL FILTERING ################
nodes-filtering-in=ns\=1;s\=Oxigen,ns\=1;s\=Speed
nodes-filtering-out=ns\=1;s\=Temperature
####################################################
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

#MONITORING PARAMETERS
samplingInterval= 0
queueSize= 10000
discardOldest= false

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

```console
docker run -d --name iotmongo -h iotmongo -v iotmongo_data:/data/db -v iotmongo_conf:/data/configdb mongo:3.4
```

```console
docker run -d --name iotage -h iotage -p 4001:4001 -p 4081:8080 --link iotmongo -v ./AGECONF:/opt/iotagent-opcua/conf rdlabengpa/opcuaage:latest
```

Further Information about how to install the OPC UA IoT Agent can be found at the corresponding section of the
[Installation & Administration Guide](https://iotagent-opcua.readthedocs.io/en/latest/installation_and_administration_guide).

## Usage

Information about how to use the IoT Agent can be found in the
[User & Programmers Manual](https://iotagent-opcua.readthedocs.io/en/latest/user_and_programmers_manual).

### Administration Services

Administration services are reachable at port specified by api-port property (config.properties).

|     |     Service     |                          Description                          |
| --- | :-------------: | :-----------------------------------------------------------: |
| GET |    `/status`    |                   Returns a status message                    |
| GET |   `/version`    | Returns information about version, name and agent description |
| GET | `/commandsList` |  Returns a list of pending commands (only with polling mode)  |
| GET |    `/config`    |                Returns loaded config.json file                |

### Poll commands

Poll commands can be enabled switching polling property to true (config.properties). Once enabled poll command, you can
customize the polling Daemon Frequency and Expiration time still in the (config.properties). The polling-commands-timer
is referred to the feature developed, that consist in the execution of the older polling command periodically (if
exists) ed delete it in case of success.

## API

Apiary reference for the Configuration API can be found
[here](http://docs.telefonicaiotiotagents.apiary.io/#reference/configuration-api) More information about IoT Agents and
their APIs can be found in the IoT Agent Library [documentation](https://iotagent-node-lib.rtfd.io/).

## Testing

For test purpose can create an OPC UA server using the code in the following
[GitHub repository](https://github.com/Engineering-Research-and-Development/opc-ua-car-server/)

Firstly edit the
[properties](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/conf/config.properties)
in order to set Northbound (NGSI) and Southbound (OPC UA) settings.

Further information about configuration properties can be found [here](docs/howto.md)

For checking current status of the Agent, send a request to /status service
(`http://{agent-ip-address}:api-port/status`)

### How to get access to the advanced API and Documentation topics

Documentation about the OPC UA Administration API can be found [here](https://opcuaiotagent.docs.apiary.io)

## Quality Assurance

The **IoT Agent for OPC UA** project is part of [FIWARE](https://www.fiware.org/)
and has been rated as follows:

-   **Version Tested:**
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Version&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.version&colorB=blue)
-   **Documentation:**
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Completeness&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.docCompleteness&colorB=blue)
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Usability&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.docSoundness&colorB=blue)
-   **Responsiveness:**
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Time%20to%20Respond&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.timeToCharge&colorB=blue)
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Time%20to%20Fix&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.timeToFix&colorB=blue)
-   **FIWARE Testing:**
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Tests%20Passed&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.failureRate&colorB=blue)
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Scalability&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.scalability&colorB=blue)
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Performance&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.performance&colorB=blue)
    ![](https://img.shields.io/badge/dynamic/json.svg?label=Stability&url=https://fiware.github.io/catalogue/json/iotagent_OPC-UA.json&query=$.stability&colorB=blue)

---

## License

The IoT Agent for OPC UA is licensed under [Affero General Public License (GPL) version 3](./LICENSE).

© 2018 Engineering Ingegneria Informatica S.p.A.

The following third-party libraries are used under license

1.  [node-opcua](http://node-opcua.github.io/) - **MIT** - © 2014-2018 Etienne Rossignon
2.  [iotagent-node-lib](https://github.com/telefonicaid/iotagent-node-lib) - **AGPL** © 2014-2018 Telefonica
    Investigación y Desarrollo

### Are there any legal issues with AGPL 3.0? Is it safe for me to use?

No problem in using a product licensed under AGPL 3.0. Issues with GPL (or AGPL) licenses are mostly related with the
fact that different people assign different interpretations on the meaning of the term “derivate work” used in these
licenses. Due to this, some people believe that there is a risk in just _using_ software under GPL or AGPL licenses
(even without _modifying_ it).

For the avoidance of doubt, the owners of this software licensed under an AGPL 3.0 license  
wish to make a clarifying public statement as follows:

> Please note that software derived as a result of modifying the source code of this software in order to fix a bug or
> incorporate enhancements is considered a derivative work of the product. Software that merely uses or aggregates (i.e.
> links to) an otherwise unmodified version of existing software is not considered a derivative work, and therefore it
> does not need to be released as under the same license, or even released as open source.
