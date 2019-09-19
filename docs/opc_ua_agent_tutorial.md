[![FIWARE Banner](https://fiware.github.io/tutorials.IoT-over-MQTT/img/fiware.png)](https://www.fiware.org/developers)
[![FIWARE Banner](https://github.com/PietroGreco/iotagent-api-adoption/blob/master/docs/img/opcua-logo.png)](https://opcfoundation.org/)

# OPC UA Agent Tutorial

This is a step-by-step tutorial that will introduce in detail how to enable OPC UA to FIWARE connecting an OPC UA server
to Orion Context Broker using the agent. The OPC UA data will be automatically published in a FIWARE Orion Context
Broker using NGSI data model.

## Actors

The actors involved in the scenario are:

-   **OPC UA Server**, representing the data source
-   **OPC UA Agent**, the connector to join industrial environment to FIWARE
-   **Orion Context Broker**, the broker as entry point of FIWARE platform

### OPC UA Server

For tutorial purposes, a simple server can be found
[here](https://github.com/Engineering-Research-and-Development/opc-ua-car-server).

![Car Schema](https://raw.githubusercontent.com/Engineering-Research-and-Development/opc-ua-car-server/master/img/car_schema.png)

It represents a car with the follow structure :

-   Car (obj)

    -   Speed (attr)
    -   Accelerate (meth)
    -   Stop (meth)
    -   Engine (obj)

        -   Temperature (attr)
        -   Oxygen (attr)

### OPC UA Agent

IoT Agent can be configured as described in the
[user guide](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/user_and_programmers_manual.md).
In order to play with OPC UA server above-mentioned, configuration files are already edited and available in test/AGE
folder.

### Orion Context Broker

Orion Context Broker can be external, however to have a black box for testing, it will be included in docker compose in
order to have a self-supporting environment.

## Docker Compose

Docker Compose can be downloaded here
[docker-compose.yml](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/test/docker-compose.yml)
:

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

Running the docker environment (using configuration files as is) creates the following situation:
![Docker Containers Schema](https://raw.githubusercontent.com/Engineering-Research-and-Development/iotagent-opcua/master/docs/images/OPC%20UA%20Agent%20tutorial%20Containers.png)

IoT Agent Devices, created by the OPC UA Agent, can be consulted with the follow curl request:

```bash
curl -X GET \
  http://iotage:4001/iot/devices \
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

```
curl -X GET \
  http://orion:1026/v2/entities \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```

In order to send a command (method in OPC UA jargon), the request has to be sent to Orion that forwards the request to
the OPC UA Agent:

```
curl -X PUT \
  'http://orion:1026/v2/entities/Car/attrs/Accelerate?type=Car' \
  -H 'content-type: application/json' \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
  -d '{
  "value": [2],
  "type": "command"
}
```

To proof that the method Accelerate is arrived to the device, It is sufficient evaluate the speed attribute (must be
greater than zero):

```
curl -X GET \
  http://orion:1026/v2/entities/Car/attrs/Speed \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo'
```
