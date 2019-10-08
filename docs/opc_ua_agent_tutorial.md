[![FIWARE Banner](https://fiware.github.io/tutorials.IoT-over-MQTT/img/fiware.png)](https://www.fiware.org/developers)
[![FIWARE Banner](https://github.com/PietroGreco/iotagent-api-adoption/blob/master/docs/img/opcua-logo.png)](https://opcfoundation.org/)

# OPC UA Agent Tutorial

This is a step-by-step tutorial that will introduce in detail how to enable OPC UA to FIWARE connecting an OPC UA server
to Orion Context Broker using the agent. The OPC UA data will be automatically published in a FIWARE Orion Context
Broker using NGSI data model.

## What is OPC UA ?

OPC-UA is a well-known client-server protocol used in the Industry.

Usually an OPC-UA server is responsible for fetching sensor data from factory-level machinery and make them available to
an OPC-UA client.

Sensor data is mapped to the OPC-UA Server Address Space as variables. It is also possible to have methods which provide
you with the possibility of control the machine.

An OPC-UA client chooses a set of variables to monitor creating a set of subscriptions, one for each variable. During
the subscription stage the client specifies, with a set of parameters, how it should receive sensor data from the
server.

In our case OPC-UA Agent acts as bridge between the OPC-UA server and the Orion Context Broker, behaving as an OPC-UA
client.

## Actors

The actors involved in the scenario are:

-   **OPC UA Server**, representing the data source
-   **OPC UA Agent**, the connector to join industrial environment to FIWARE
-   **Orion Context Broker**, the broker as entry point of FIWARE platform

#### OPC-UA Server

For tutorial purposes, you will use a simple OPC-UA server (source code
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
In order to play with OPC UA server above-mentioned, configuration files are already edited and available in test/AGE
folder.

#### Orion Context Broker

Orion Context Broker can be external, however to have a black box for testing, it will be included in docker compose in
order to have a self-supporting environment.

## Step-by-step Tutorial

In this paragraph we are going to describe how to quickly deploy a working testbed consisting of all the actors: Car,
Agent, Orion Context Broker and the two MongoDB instances.

#### Step 0 - Prerequisites

-   Docker
-   Docker-compose

Install docker and docker-compose by following the instructions on the official web site

-   Docker: https://docs.docker.com/install/linux/docker-ce/ubuntu/
-   Docker-Compose: https://docs.docker.com/compose/install/

Before continuing we suggest you to check if both docker and docker-compose work correctly

#### Step 1 - Clone the OPCUA Agent Repository

Open a terminal and move into a folder in which to create the new folder containing the IotAgent testbed.

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

To check if all the required components are running

Running the docker environment (using configuration files as is) creates the following situation:
![Docker Containers Schema](https://raw.githubusercontent.com/Engineering-Research-and-Development/iotagent-opcua/master/docs/images/OPC%20UA%20Agent%20tutorial%20Containers.png)

#### Step 3 - Start using the testbed

For the Agent to work an initialization phase is required. During this phase the Agent becomes aware of what variables
and methods are available on OPC UA server side. These information can be provided to the agent by means of a
configuration file (config.json) or through the REST API.

Three different initialization modalities are available:

-   Use a preloaded config.json
-   Invoke a mapping tool responsible of automatically building the config.json
-   Use the REST API

In the following parts of this tutorial we are going to use the REST API (default config.json is empty)

#### Step 4 - Provision a new Device

By Device we mean the set of variables (attributes) and methods available on OPC UA Server side.

To provision the Device corresponding to what the CarServer offers, use the following REST call:

```bash
curl http://localhost:4002/iot/devices \
     -H "fiware-service: opcua_car" \
     -H "fiware-servicepath: /demo" \
     -H "Content-Type: application/json" \
     -d @add_device.json
```

Where add_device.json is the one you find inside iotagent-opcua/API_Server_Tests folder

#### Step 5 - Get devices

Check if the operation gone well, by sending the following REST call:

```bash
curl http://localhost:4002/iot/devices \
     -H "fiware-service: opcua_car" \
     -H "fiware-servicepath: /demo"
```

You will obtain a JSON indicating that there is one device:

[aggiungere estratto corpo JSON]

#### Interlude

You can interact with the CarServer through the Agent in three different ways:

-   **Active attributes** For attributes mapped as **active** the Agent receives in real-time the updated values

-   **Lazy attributes** For this kind of attribute the OPC UA Server is not willing to send the value to the Agent,
    therefore this can be obtained only upon request. The agent registers itself as lazy attribute provider being
    responsible for retrieving it

-   **Commands**

    Through the requests described below it is possible to execute methods on the OPC UA server.

#### Step 6 - Monitor Agent behaviour

Any activity regarding the Agent can be monitored looking at the logs. To view docker testbed logs run:

```bash
cd iotagent-opcua
docker-compose logs -f
```

Looking at these logs is useful to spot possible errors.

#### Step 7 - Accelerate

In order to send the Accelerate command (method in OPC UA jargon), the request has to be sent to Orion that forwards the
request to the OPC UA Agent:

```bash
curl -X PUT \
  'http://localhost:1026/v2/entities/age01_Car/attrs/Accelerate?type=Device' \
  -H 'content-type: application/json' \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
  -d '{
  "value": [2],
  "type": "command"
}
```

To proof that the method Accelerate is arrived to the device, It is sufficient to evaluate the speed attribute (must be
greater than zero):

```bash
curl -X GET \
  http://localhost:1026/v2/entities/age01_Car/attrs/Speed \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```

The OPC UA Agent monitors all attributes defined as active into config.json file, after creation of NGSI entity as
proof:

```bash
curl -X GET \
  http://orion:1026/v2/entities \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```

Every value change can be seen into docker-compose logs and performing requests to Orion as:

```bash
curl -X GET \
  http://orion:1026/v2/entities \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```

#### Appendix A - Customize the environment

Docker Compose can be downloaded here
[docker-compose.yml](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/test/docker-compose.yml):

```yaml
version: "2.3"
services:

################### TEST DOCKER ENVIRONMENT ##############################

   iotage:
      hostname: iotage
      image: rdlabengpa/opcuaage:latest
      networks:
         - hostnet
         - iotnet
      ports:
         - "4001:4001"
         - "8080:8080"
      depends_on:
         - iotcarsrv
         - iotmongo
         - orion
      volumes:
         - ./AGE:/opt/iotagent-opcua/conf

   iotcarsrv:
      hostname: iotcarsrv
      image: beincpps/opcuacarsrv:latest
      networks:
         - iotnet
      ports:
         - "5001:5001"
      volumes:
         - ./CAR/car.js:/opt/opc-ua-car-server/car.js

   iotmongo:
      hostname: iotmongo
      image: mongo:3.4
      networks:
         - iotnet
      ports:
        - "27017:27017"
      volumes:
         - iotmongo_data:/data/db
         - iotmongo_conf:/data/configdb

   orion:
      image: fiware/orion
      networks:
         - iotnet
      links:
        - mongo
      ports:
        - "1026:1026"
      depends_on:
         - mongo
      command: -dbhost mongo

   mongo:
      image: mongo:3.4
      networks:
         - iotnet
      command: --nojournal

##########################################################

volumes:
       iotmongo_data:
       iotmongo_conf:

networks:
       hostnet:
       iotnet:
```

To run docker-compose follow these steps:

```bash
git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua"
cd iotagent-opcua
cd test
docker-compose up &
```

Under the test folder there are two configuration folders:

-   AGE with OPC UA Agent configuration files (to set OPC UA variables, methods and to create the mapping with NGSI)
-   CAR with OPC UA Car Server JavaScript file (to set address and port of the server)
