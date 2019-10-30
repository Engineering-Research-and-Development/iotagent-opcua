[![FIWARE Banner](https://fiware.github.io/tutorials.IoT-over-MQTT/img/fiware.png)](https://www.fiware.org/developers)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[![OPC Banner](https://opcfoundation.org/wp-content/themes/opc/images/logo.jpg)](https://opcfoundation.org/)

# OPC UA Agent Tutorial

This is a step-by-step tutorial that will introduce in detail how to enable OPC UA to FIWARE connecting an OPC UA server
to Orion Context Broker using the agent. The OPC UA data will be automatically published in a FIWARE Orion Context
Broker using NGSI data model.

## What is OPC UA?

OPC UA is a well-known client-server protocol used in the Industry.

In real environments, an OPC UA server is usually responsible for fetching sensor data from factory-level machinery making them available to an OPC UA client (the Agent in our case).

Before a client can retrieve their values, sensors are mapped to the OPC UA Server Address Space as variables (or attributes).
Moreover, it is also possible to control the machinery invoking methods exposed by the server.

Sensor values access is provided through a subscription mechanism. For each sensor value the OPC UA client wants to have access to, it creates a subscription specifying some parameters. Using these parameters the client asks the server to send data according to some particular modalities. At that point the server determines if the requests can be fullfilled, otherwise it will continue sending data in a best effort mode.

Here a short description of the most relevant parameters:
 - **samplingInterval** defines, for each MonitoredItem, the interval used by the server to evaluate changes in the value of the variable. The actual value chosen by the server depends on the underlying hardware capabilities
 - **publishingInterval** defines the interval that has to elapse to notify possible changes to the client. Whenever the server discovers a change in the value of a variable, this new value is stored into the queue. When publishingInterval expires the entire queue is sent to the client. In this way the client can receive even very fast changes that otherwise would not have been detected
 - **queueSize** defines, for each Monitoreditem, the size of the queue within which to store changes in the variable. When samples are sent to the client the queue is emptied

In our case the OPC UA Agent acts as bridge between the OPC UA server and the Orion Context Broker behaving as an OPC UA
client.

## Actors

The actors involved in the scenario are:

-   **OPC UA Server**, representing the data source
-   **OPC UA Agent**, the connector to join industrial environment to FIWARE
-   **Orion Context Broker**, the broker as entry point of FIWARE platform

#### OPC UA Server

For tutorial purposes, you will use a simple OPC UA server (source code
[here](https://github.com/Engineering-Research-and-Development/opc-ua-car-server)).

![Car Schema](https://raw.githubusercontent.com/Engineering-Research-and-Development/opc-ua-car-server/master/img/car_schema.png)

It represents a car with the following structure:

-   Car (obj)

    -   Speed (attr)

    -   Accelerate (meth)

-   Stop (meth)

    -   Engine (obj)

        -   Temperature (attr)
        -   Oxygen (attr)

-   Sensors

    -   Any number of user-defined Boolean sensor simulating a square-wave

        For each sensor it is possible to define the semi-period

#### OPC UA Agent

IoT Agent can be configured as described in the
[user guide](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/user_and_programmers_manual.md).
In order to start playing with the above mentioned OPC UA server, configuration files have been already edited and available in AGECONF
folder.

#### Orion Context Broker

Orion Context Broker can be external, however to have a black box for testing, it will be included in docker compose in
order to have a self-supporting environment.

## Step-by-step Tutorial

In this paragraph we are going to describe how to quickly deploy a working testbed consisting of all the actors: Car,
Agent, Orion Context Broker and the two MongoDB instances.

#### Requirements

-   Docker (Version 19.03.1+)
-   Docker-compose (Version 1.24.1+)

Install docker and docker-compose by following the instructions available on the official web site:

-   Docker: https://docs.docker.com/install/linux/docker-ce/ubuntu/
-   Docker-Compose: https://docs.docker.com/compose/install/

Once docker has been correctly installed you can continue with the other steps

#### Step 1 - Clone the OPCUA Agent Repository

Open a terminal and move into a folder in which to create the new folder containing the IotAgent testbed

Then run:

```bash
git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua"
```

#### Step 2 - Run the testbed

To launch the whole testbed:

```bash
cd iotagent-opcua
docker-compose up -d
```

After that you can run:

```bash
docker ps
```

to check if all the required components are running

Running the docker environment (using configuration files as is) creates the following situation:
![Docker Containers Schema](https://raw.githubusercontent.com/Engineering-Research-and-Development/iotagent-opcua/master/docs/images/OPC%20UA%20Agent%20tutorial%20Containers.png)

Appendix A quickly describes what you can do with the docker-compose.yml

#### Step 3 - Start using the testbed

For the Agent to work an **initialization** phase is required. During this phase the Agent becomes aware of what variables
and methods are available on OPC UA server side. These information can be provided to the agent by means of a
configuration file (config.json) or through the REST API

Three different initialization modalities are available:

-   Use a preloaded config.json
-   Invoke a mapping tool responsible of automatically building the config.json
    (**NOTE:** ***Before using the MappingTool, erase the current config.json and comment "configuration=api" row in config.properties***)
-   Use the REST API

Since in the following parts of this tutorial we are going to use the REST API you do not have to worry about the initialization. The default empty config.json is preloaded

#### Step 4 - Provision a new Device

By Device we mean the set of variables (attributes) and methods available on OPC UA Server side.

To provision the Device corresponding to what the CarServer offers, use the following REST call:

```bash
curl http://localhost:4001/iot/devices \
     -H "fiware-service: opcua_car" \
     -H "fiware-servicepath: /demo" \
     -H "Content-Type: application/json" \
     -d @add_device.json
```

Where `add_device.json` is the one you find inside `iotagent-opcua/testCommands` folder

`add_device.json` sample payload contains several attributes even of different type. Some of them are missing on the OPC
UA Server side but have been included to prove that the Agent is able to manage such situations.

#### Step 5 - Get devices

Check if the operation went well, by sending the following REST call:

```bash
curl http://localhost:4001/iot/devices \
     -H "fiware-service: opcua_car" \
     -H "fiware-servicepath: /demo"
```

You should obtain a JSON indicating that there is one device

#### Interlude

You can interact with the CarServer through the Agent in three different ways:

-   **Active attributes** For attributes mapped as **active** the Agent receives in real-time the updated values

-   **Lazy attributes** For this kind of attribute the OPC UA Server is not willing to send the value to the Agent,
    therefore this can be obtained only upon request. The agent registers itself as lazy attribute provider being
    responsible for retrieving it

-   **Commands**

    Through the requests described below it is possible to execute methods on the OPC UA server

Examples of what has been just illustrated can be found in `add_device.json` file

#### Step 6 - Monitor Agent behaviour

Any activity regarding the Agent can be monitored looking at the logs. To view docker testbed logs run:

```bash
cd iotagent-opcua
docker-compose logs -f
```

Looking at these logs is useful to spot possible errors

#### Step 7 - Accelerate

In order to send the Accelerate command (method in OPC UA jargon), the request has to be sent to Orion that forwards the
request to the OPC UA Agent:

```bash
curl -X PUT \
  'http://localhost:1026/v2/entities/age01_Car/attrs/Accelerate?type=Device' \
  -H 'content-type: application/json' \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo' \
  -d '{
  "value": [2],
  "type": "command"
}'
```

To proof that the method Accelerate is arrived to the device, it is sufficient to evaluate the speed attribute (must be
greater than zero):

```bash
curl -X GET \
  http://localhost:1026/v2/entities/age01_Car/attrs/Speed \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```

The OPC UA Agent monitors all attributes defined as active into `config.json` file, after creation of NGSI entity as
proof:

```bash
curl -X GET \
  http://localhost:1026/v2/entities \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```

## What's next?
Finishing this tutorial you have an overview on how the Agent works and interacts with the other components (OPC UA Server and Orion Context Broker).

In order to fully understand how the OPC UA IotAgent can be used in a ***real environment*** (i.e. connected to an ***external OPC UA Server***) you probably need some further information  on the initialization/configuration stage, i.e. where the link between the Agent and the machinery is established.

These information are available in the [User & Programmers Manual](https://iotagent-opcua.readthedocs.io/en/latest/user_and_programmers_manual/index.html) section

#### How to build the Docker Image
If you have changes to the Agent codebase that you want to integrate, or you want to modify the current Docker deployment package:

[Here](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/docker_readme.md) you find the instructions on how to build a Docker Image for the Agent

## Appendices
#### Appendix A - Customize the environment

Docker Compose can be downloaded here
[docker-compose.yml](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/api_adoption/docker-compose.yml):

Modifying this file you can:

-   Change exposed ports
-   Extend the stack with other services (e.g. Cygnus)

```yaml
version: "3"
secrets:
   age_idm_auth:
      file: age_idm_auth.txt

services:
  iotcarsrv:
    hostname: iotcarsrv
    image: iotagent4fiware/opcuacarsrv:1.3.4
    networks:
      - hostnet
    ports:
      - "5001:5001"

  iotage:
    hostname: iotage
    image: iotagent4fiware/iotagent-opcua:1.3.4
    networks:
      - hostnet
      - iotnet
    ports:
      - "4001:4001"
      - "4081:8080"
    depends_on:
      - iotcarsrv
      - iotmongo
      - orion
    volumes:
      - ./AGECONF:/opt/iotagent-opcua/conf
    command: /usr/bin/tail -f /var/log/lastlog

  iotmongo:
    hostname: iotmongo
    image: mongo:3.4
    networks:
      - iotnet
    volumes:
      - iotmongo_data:/data/db
      - iotmongo_conf:/data/configdb

  ################ OCB ################

  orion:
    hostname: orion
    image: fiware/orion:latest
    networks:
      - hostnet
      - ocbnet
    ports:
      - "1026:1026"
    depends_on:
      - orion_mongo
    #command: -dbhost mongo
    entrypoint: /usr/bin/contextBroker -fg -multiservice -ngsiv1Autocast -statCounters -dbhost mongo -logForHumans -logLevel DEBUG -t 255

  orion_mongo:
    hostname: orion_mongo
    image: mongo:3.4
    networks:
      ocbnet:
        aliases:
          - mongo
    volumes:
      - orion_mongo_data:/data/db
      - orion_mongo_conf:/data/configdb
    command: --nojournal

volumes:
  iotmongo_data:
  iotmongo_conf:
  orion_mongo_data:
  orion_mongo_conf:

networks:
  hostnet:
  iotnet:
  ocbnet:

```
