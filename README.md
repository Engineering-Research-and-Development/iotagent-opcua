# F4I OPC UA Agent
This project is part of FIWARE.

https://www.fiware.org/ <br/>
https://catalogue.fiware.org/
    
The F4I OPC UA Agent is an Open Source component intended to enable capturing data from OPC UA devices on the shopfloor and provide them to the upper levels of a FIWARE-based system. Therefore, the main focus of this component is on the communication from field devices implementing an OPC UA server to FIWARE, allowing the communication to the FIWARE Orion Context Broker.

The intended level of complexity to support these operations should consider a limited human intervention (mainly during the setup of a new OPC UA endpoint), through the mean of a parametrization task (either manual or semi-automatic, using a text-based parametrization or a simple UI to support the configuration) so that no software coding is required to adapt the agent to different OPC UA devices.

## ![N|Solid](https://img.shields.io/badge/license-AGPL-blue.svg) License
https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/LICENSE
## ![N|Solid](https://readthedocs.org/projects/iotagent-opcua/badge/?version=latest) Documentation
https://github.com/Engineering-Research-and-Development/iotagent-opcua/tree/master/docs <br/>
https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/user_and_programmers_manual.md

## ![N|Solid](https://img.shields.io/docker/pulls/beincpps/opcuaage.svg) Docker
https://hub.docker.com/r/beincpps/opcuaage/

## ![N|Solid](https://img.shields.io/badge/support-sof-yellowgreen.svg) Support
https://github.com/Engineering-Research-and-Development/iotagent-opcua/issues


## How to Deploy the GEi

## How to run tests

For test purpose can use a server available here:<br/>
https://github.com/Engineering-Research-and-Development/opc-ua-car-server/

Firstly edit properties https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/conf/config.properties in order to set Northbound (NGSI) and Southbound (OPC UA) settings.

Here https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/howto.md are available informations about configuration properties.

For checking current status of the Agent, send a request to /status service (http://{agent-ip-address}:api-port/status)  

## How to get access to the advanced API and Documentation topics
Here https://opcuaiotagent.docs.apiary.io are available documentation about Administration API. 
## Installation 
```sh
$ npm install
$ node index.js
```

## Positioning in the overall F4I Reference Architecture
The F4I OPC UA Agent is based on the reference implementation of the FIWARE Backend Device Management Generic Enabler, IDAS, delivered by Telefonica I+D.
IDAS provides a collection of Agents - i.e., independent processes that are typically executed in the proximity of IoT devices and that are responsible for bridging a specific IoT protocol to the NGSI standard (e.g. the IDAS distribution includes off-the-shelf Agents for LwM2M and MQTT). To this end, IDAS links the NGSI southbound API of the FIWARE Orion Context Broker to the northbound API of the IoT application stack, by providing a software library (the IoT Agent Lib depicted in the previous figure) for developing custom Agents that may extend the bridging capabilities of IDAS to other protocols. The F4I IDAS OPC-UA Agent makes use of this framework to integrate OPC-UA-based devices in a publish-subscribe system based on the FIWARE Orion Context Broker.


## Administration Services
Administration services are reachable at port specified by api-port property (config.properties).

|     |    Service    |                          Description                          |
|-----|:-------------:|:-------------------------------------------------------------:|
| GET | /status       | Returns a status message                                      |
| GET | /version      | Returns information about version, name and agent description |
| GET | /commandsList | Returns a list of pending commands (only with polling mode)   |


## Poll commands
Poll commands can be enabled switching polling property to true (config.properties). Once enabled poll command, you can customize the polling Daemon Frequency and Expiration time still in the (config.properties). The polling-commands-timer is referred to the feature developed, that consist in the execution of the older polling command periodically (if exists) ed delete it in case of success.

## Third party libraries:
1. http://node-opcua.github.io/
2. https://github.com/telefonicaid/iotagent-node-lib
