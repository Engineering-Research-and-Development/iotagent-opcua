# OPC UA IoTAgent

[![FIWARE IoT Agents](https://nexus.lab.fiware.org/static/badges/chapters/iot-agents.svg)](https://www.fiware.org/developers/catalogue/)
[![License: AGPL](https://img.shields.io/github/license/Engineering-Research-and-Development/iotagent-opcua.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Docker badge](https://img.shields.io/docker/pulls/iotagent4fiware/iotagent-opcua.svg)](https://hub.docker.com/r/iotagent4fiware/iotagent-opcua/)
[![Support badge](https://img.shields.io/badge/support-stackoverflow-orange)](https://stackoverflow.com/questions/tagged/fiware+iot)<br/>
[![Documentation badge](https://img.shields.io/readthedocs/iotagent-opcua.svg)](https://iotagent-opcua.rtfd.io/)
[![CI](https://github.com/Engineering-Research-and-Development/iotagent-opcua/workflows/CI/badge.svg)](https://github.com/Engineering-Research-and-Development/iotagent-opcua/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/Engineering-Research-and-Development/iotagent-opcua/badge.svg?branch=master)](https://coveralls.io/github/Engineering-Research-and-Development/iotagent-opcua?branch=master)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/4612/badge)](https://bestpractices.coreinfrastructure.org/projects/4612)
![Status](https://nexus.lab.fiware.org/static/badges/statuses/full.svg)
[![Join the chat at https://gitter.im/iotagent-opcua/community](https://badges.gitter.im/iotagent-opcua/community.svg)](https://gitter.im/iotagent-opcua/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An Internet of Things Agent accepting data from OPC UA devices. This IoT Agent is designed to be a bridge between the
OPC Unified Architecture protocol and the
[NGSI](https://swagger.lab.fiware.org/?url=https://raw.githubusercontent.com/Fiware/specifications/master/OpenAPI/ngsiv2/ngsiv2-openapi.json)
interface of a context broker.

The intended level of complexity to support these operations should consider a limited human intervention (mainly during
the setup of a new OPC UA endpoint), through the mean of a parametrization task (either manual or semi-automatic, using
a text-based parametrization or a simple UI to support the configuration) so that no software coding is required to
adapt the agent to different OPC UA devices.

It is based on the [IoT Agent Node.js Library](https://github.com/telefonicaid/iotagent-node-lib). Further general
information about the FIWARE IoT Agents framework, its architecture and the common interaction model can be found in the
library's GitHub repository.

This project is part of [FIWARE](https://www.fiware.org/). For more information check the
[FIWARE Catalogue entry for the IoT Agents](https://github.com/Fiware/catalogue/tree/master/iot-agents).

| :books: [Documentation](https://iotagent-opcua.rtfd.io) | :whale: [Docker Hub](https://hub.docker.com/r/iotagent4fiware/iotagent-opcua) | :mortar_board: [Academy](https://fiware-academy.readthedocs.io/en/latest/iot-agents/idas) | :dart: [Roadmap](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/roadmap.md) |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |


## Contents

-   [Background](#background)
-   [Install](#getting-started---install)
    -   [Docker install](#docker---recommended)
    -   [NPM Install](#npm)
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

## Getting Started - Install

Currently two options are available to install the Agent:

### Docker - Recommended

We suggest using a **Docker-first** approach in order to avoid issues related to your environment configuration.
Moreover, using this approach you will be provided with all the needed components: OCB, Mongo instances and a sample OPC
UA server.

A step-by-step tutorial is available
[here](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/opc_ua_agent_tutorial.md)

### npm

Before launching the Agent you must install Orion Context Broker and a OPC UA Server. After that you must tell the Agent
how to interact with these components by using config.properties file. Once configuration is complete you can execute
these commands to run the Agent.

```console
$ npm install
$ node index.js
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

### Configure Secure connection with an OPC UA Server

Documentation about OPC UA Client Secure connection can be found [here](docs/opc_ua_secure_connection_configuration.md)


### How to get access to the advanced API and Documentation topics

Documentation about the OPC UA Administration API can be found [here](https://opcuaiotagent.docs.apiary.io)

## Quality Assurance

The **IoT Agent for OPC UA** project is part of [FIWARE](https://fiware.org/) and has been rated as follows:

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

© 2020 Engineering Ingegneria Informatica S.p.A.

The following third-party libraries are used under license

1.  [node-opcua](http://node-opcua.github.io/) - **MIT** - © 2014-2018 Etienne Rossignon
2.  [iotagent-node-lib](https://github.com/telefonicaid/iotagent-node-lib) - **AGPL** © 2014-2018 Telefonica
    Investigación y Desarrollo

The full list of third-party libraries licenses can be found
[here](https://htmlpreview.github.io/?https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/opc_ua_agent_dependencies.html)

### Are there any legal issues with AGPL 3.0? Is it safe for me to use?

No problem in using a product licensed under AGPL 3.0. Issues with GPL (or AGPL) licenses are mostly related with the
fact that different people assign different interpretations on the meaning of the term “derivate work” used in these
licenses. Due to this, some people believe that there is a risk in just _using_ software under GPL or AGPL licenses
(even without _modifying_ it).

For the avoidance of doubt, the owners of this software licensed under an AGPL 3.0 license wish to make a clarifying
public statement as follows:

"Please note that software derived as a result of modifying the source code of this software in order to fix a bug or
incorporate enhancements is considered a derivative work of the product. Software that merely uses or aggregates (i.e.
links to) an otherwise unmodified version of existing software is not considered a derivative work, and therefore it
does not need to be released as under the same license, or even released as open source."
