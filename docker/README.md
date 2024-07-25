# FIWARE IoT Agent for the OPC-UA

[![FIWARE IoT Agents](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/iot-agents.svg)](https://www.fiware.org/developers/catalogue/)
[![](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/iot-agents.svg)](https://stackoverflow.com/questions/tagged/fiware+iot)

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

This project is part of [FIWARE](https://www.fiware.org/). For more information check the FIWARE Catalogue entry for the
[IoT Agents](https://github.com/Fiware/catalogue/tree/master/iot-agents).

## How to use this image

The IoT Agent must be instantiated and connected to an instance of the
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/), a sample `docker-compose` file can be found
below.

If the `IOTA_REGISTRY_TYPE=mongodb`, a [MongoDB](https://www.mongodb.com/) database instance is also required - the
example below assumes that you have a `/data` directory in your hosting system in order to hold database files - please
amend the attached volume to suit your own configuration.

```yml
version: "3.1"

volumes:
    mongodb: ~

services:
    iot-agent:
        image: iotagent4fiware/iotagent-opcua:latest
        hostname: iotagent-opcua
        depends_on:
            - mongodb
            - iotcarsrv
            - orion
        networks:
            - hostnet
        ports:
            - "4041:4041"
            - "9229:9229"
        environment:
            - "IOTA_LOGLEVEL=DEBUG"
            - "IOTA_TIMESTAMP=true"
            - "IOTA_CB_HOST=orion"
            - "IOTA_CB_PORT=1026"
            - "IOTA_CB_NGSIVERSION=v2"
            - "IOTA_CB_NGSILDCONTEXT=https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            - "IOTA_CB_SERVICE=opcua_car"
            - "IOTA_CB_SUBSERVICE=/demo"
            - "IOTA_NORTH_PORT=4041"
            - "IOTA_REGISTRY_TYPE=mongodb"
            - "IOTA_MONGO_HOST=mongodb"
            - "IOTA_MONGO_PORT=27017"
            - "IOTA_MONGO_DB=iotagent_opcua"
            - "IOTA_SERVICE=opcua_car"
            - "IOTA_SUBSERVICE=/demo"
            - "IOTA_PROVIDER_URL=http://iotagent-opcua:4041"
            - "IOTA_DEVICEREGDURATION=P20Y"
            - "IOTA_DEFAULTTYPE=Device"
            - "IOTA_DEFAULTRESOURCE=/iot/opcu"
            - "IOTA_EXPLICITATTRS=true"
            - "IOTA_EXTENDED_FORBIDDEN_CHARACTERS=[]"
            - "IOTA_AUTOPROVISION=true"
            - "IOTA_EXPRESS_LIMIT=50mb"
            - "IOTA_OPCUA_ENDPOINT=opc.tcp://iotcarsrv:5001/UA/CarServer"
            - "IOTA_OPCUA_SECURITY_MODE=None"
            - "IOTA_OPCUA_SECURITY_POLICY=None"
            #- "IOTA_OPCUA_SECURITY_USERNAME=null"
            #- "IOTA_OPCUA_SECURITY_PASSWORD=null"
            - "IOTA_OPCUA_UNIQUE_SUBSCRIPTION=false"
            - "IOTA_OPCUA_SUBSCRIPTION_NOTIFICATIONS_PER_PUBLISH=1000"
            - "IOTA_OPCUA_SUBSCRIPTION_PUBLISHING_ENABLED=true"
            - "IOTA_OPCUA_SUBSCRIPTION_REQ_LIFETIME_COUNT=100"
            - "IOTA_OPCUA_SUBSCRIPTION_REQ_MAX_KEEP_ALIVE_COUNT=10"
            - "IOTA_OPCUA_SUBSCRIPTION_REQ_PUBLISHING_INTERVAL=1000"
            - "IOTA_OPCUA_SUBSCRIPTION_PRIORITY=128"
            - "IOTA_OPCUA_MT_POLLING=false"
            - "IOTA_OPCUA_MT_AGENT_ID=age01_"
            - "IOTA_OPCUA_MT_ENTITY_ID=age01_Car"
            - "IOTA_OPCUA_MT_ENTITY_TYPE=Device"
            - "IOTA_OPCUA_MT_NAMESPACE_IGNORE=0,7"
            - "IOTA_OPCUA_MT_STORE_OUTPUT=true"
        volumes:
            - ../conf:/opt/iotagent-opcua/conf

    mongodb:
        image: mongo:4.2
        hostname: mongodb
        networks:
            - hostnet
        expose:
            - "27017"
        command: --bind_ip_all
        volumes:
            - mongodb:/data

    orion:
        image: fiware/orion
        hostname: orion
        depends_on:
            - mongodb
        networks:
            - hostnet
        ports:
            - "1026:1026"
        command: -dbhost mongodb -logLevel DEBUG

    iotcarsrv:
        hostname: iotcarsrv
        image: iotagent4fiware/opcuacarsrv:latest
        networks:
            - hostnet
        ports:
            - "5001:5001"

networks:
    hostnet:
```

## Configuration with environment variables

Many settings can be configured using Docker environment variables. A typical IoT Agent Docker container is driven by
environment variables such as those shown below:

-   `CONFIGURATION_TYPE` - flag indicating which configuration type to perform. Possible choices are: auto, dynamic and
    static
-   `CONFIG_RETRIEVAL` - flag indicating whether the incoming notifications to the IoTAgent should be processed using
    the bidirectionality plugin from the latest versions of the library or the OPCUA-specific configuration retrieval
    mechanism.
-   `DEFAULT_KEY` - Default API Key, to use with device that have been provisioned without a Configuration Group.
-   `DEFAULT_TRANSPORT` - Default transport protocol when no transport is provisioned through the Device Provisioning
    API.
-   `IOTA_LOGLEVEL` - Log level for iotagentnode lib
-   `IOTA_TIMESTAMP` - Whether the IoTAgent will add the TimeInstant attribute to every entity created, as well as a
    TimeInstant metadata to each attribute, with the current timestamp
-   `IOTA_CB_HOST` - Hostname of the context broker to update context
-   `IOTA_CB_PORT` - Port that context broker listens on to update context
-   `IOTA_CB_NGSIVERSION` - Version of the Context Broker
-   `IOTA_CB_NGSILDCONTEXT` - JSON LD Context
-   `IOTA_CB_SERVICE` - Fallback Tenant for the Context Broker
-   `IOTA_CB_SUBSERVICE` - Fallback Path for the Context Broker
-   `IOTA_NORTH_PORT` - Port used for configuring the IoT Agent and receiving context updates from the context broker
-   `IOTA_REGISTRY_TYPE` - Whether to hold IoT device info in memory or in a database
-   `IOTA_MONGO_HOST` - The hostname of MongoDB - used for holding device and service information
-   `IOTA_MONGO_PORT` - The port that MongoDB is listening on
-   `IOTA_MONGO_DB` - The name of the database used in MongoDB
-   `IOTA_SERVICE` - Default service, for IoT Agent installations that won't require preregistration
-   `IOTA_SUBSERVICE` - Default subservice, for IoT Agent installations that won't require preregistration
-   `IOTA_PROVIDER_URL` - URL passed to the Context Broker when commands are registered, used as a forwarding URL
    location when the Context Broker issues a command to a device
-   `IOTA_DEVICEREGDURATION` - Default maximum expire date for device registrations
-   `IOTA_DEFAULTTYPE` - Default type, for IoT Agent installations that won't require preregistration
-   `IOTA_DEFAULTRESOURCE` - Default resource of the IoT Agent. This value must be different for every IoT Agent
    connecting to the IoT Manager
-   `IOTA_EXPLICITATTRS` - Flag indicating whether the incoming measures to the IoTAgent should be processed as per the
    "attributes" field
-   `IOTA_EXTENDED_FORBIDDEN_CHARACTERS` - List of characters to be filtered before forwarding any request to the
    Context Broker
-   `IOTA_AUTOPROVISION` - Flag indicating whether to provision the Group and Device automatically
-   `IOTA_EXPRESS_LIMIT` - Default limit for express router built into iotagent-node-lib module
-   `IOTA_OPCUA_ENDPOINT` - Endpoint of OPC UA Server
-   `IOTA_OPCUA_SECURITY_MODE` - Security mode for OPC UA connection
-   `IOTA_OPCUA_SECURITY_POLICY` - Security policy for OPC UA connection
-   `IOTA_OPCUA_SECURITY_USERNAME` - Username for OPC UA connection
-   `IOTA_OPCUA_SECURITY_PASSWORD` - Password for OPC UA connection
-   `IOTA_OPCUA_UNIQUE_SUBSCRIPTION` - Boolean property to assess whether subscribe once for multiple OPC UA nodes or
    not
-   `IOTA_OPCUA_SUBSCRIPTION_NOTIFICATIONS_PER_PUBLISH` - OPCUA subscription number of notifications per publish
-   `IOTA_OPCUA_SUBSCRIPTION_PUBLISHING_ENABLED` - Boolean property to assess whether enable OPCUA publishing or not
-   `IOTA_OPCUA_SUBSCRIPTION_REQ_LIFETIME_COUNT` - OPCUA subscription lifetime count
-   `IOTA_OPCUA_SUBSCRIPTION_REQ_MAX_KEEP_ALIVE_COUNT` - OPCUA subscription request maximum keep alive count
-   `IOTA_OPCUA_SUBSCRIPTION_REQ_PUBLISHING_INTERVAL` - OPCUA subscription request publishing interval
-   `IOTA_OPCUA_SUBSCRIPTION_PRIORITY` - OPCUA subscription priority
-   `IOTA_EXTENDED_FORBIDDEN_CHARACTERS` - List of characters to be filtered before forwarding any request to Orion.
    Default Orion forbidden characters are filtered by default, see
    [here](https://github.com/telefonicaid/fiware-orion/blob/74aaae0c98fb24f082e3b258aa642461eb285e39/doc/manuals/orion-api.md#general-syntax-restrictions)
-   `IOTA_OPCUA_MT_POLLING` - Boolean property to assess whether enable polling in MappingTool or not
-   `IOTA_OPCUA_MT_AGENT_ID` - agentId prefix to be assigned to the newly generated entity from MappingTool execution
-   `IOTA_OPCUA_MT_ENTITY_ID` - entityId to be assigned to the newly generated entity from MappingTool execution
-   `IOTA_OPCUA_MT_ENTITY_TYPE` - entityType to be assigned to the newly generated entity from MappingTool execution
-   `IOTA_OPCUA_MT_NAMESPACE_IGNORE` - Namespaces to ignore when crawling nodes from OPC UA Server
-   `IOTA_OPCUA_MT_STORE_OUTPUT` - boolean flag to determine whether to store the output of the mapping tool execution
    or not

### Further Information

The full set of overrides for the general parameters applicable to all IoT Agents are described in the Configuration
section of the IoT Agent Library
[Installation Guide](https://iotagent-node-lib.readthedocs.io/en/latest/installationguide/index.html#configuration).

Further settings for IoT Agent for OPC-UA itself - can be found in the IoT Agent for OPC-UA
[Installation Guide](https://iotagent-opcua.readthedocs.io/en/latest/installationguide/index.html#configuration).

## How to build an image

The [Dockerfile](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docker/Dockerfile)
associated with this image can be used to build an image in several ways:

-   By default, the `Dockerfile` retrieves the **latest** version of the codebase direct from GitHub (the `build-arg` is
    optional):

```console
docker build -t iot-agent . --no-cache --build-arg DOWNLOAD=lastest
```

-   You can also download a specific release by running this `Dockerfile` with the build argument `DOWNLOAD=<version>`

```console
docker build -t iot-agent . --no-cache --build-arg DOWNLOAD=2.0.0
```

## Building from your own fork

To download code from your own fork of the GitHub repository add the `GITHUB_ACCOUNT`, `GITHUB_REPOSITORY` and
`SOURCE_BRANCH` arguments (default `master`) to the `docker build` command.

```console
docker build -t iot-agent . \
    --build-arg GITHUB_ACCOUNT=<your account> \
    --build-arg GITHUB_REPOSITORY=<your repo> \
    --build-arg SOURCE_BRANCH=<your branch>
```

## Building from your own source files

Alternatively, if you want to build directly from your own sources, please copy the existing `Dockerfile` into file the
root of the repository and amend it to copy over your local source using :

```Dockerfile
COPY . /opt/iotagent-opcua/
```

Full instructions can be found within the `Dockerfile` itself.

### Using PM2

The IoT Agent within the Docker image can be run encapsulated within the [pm2](http://pm2.keymetrics.io/) Process
Manager by adding the `PM2_ENABLED` environment variable.

```console
docker run --name iotagent -e PM2_ENABLED=true -d iotagent4fiware/iotagent-opcua
```

Use of pm2 is **disabled** by default. It is unnecessary and counterproductive to add an additional process manager if
your dockerized environment is already configured to restart Node.js processes whenever they exit (e.g. when using
[Kubernetes](https://kubernetes.io/))

### Docker Secrets

As an alternative to passing sensitive information via environment variables, `_FILE` may be appended to some sensitive
environment variables, causing the initialization script to load the values for those variables from files present in
the container. In particular, this can be used to load passwords from Docker secrets stored in
`/run/secrets/<secret_name>` files. For example:

```console
docker run --name iotagent -e IOTA_AUTH_PASSWORD_FILE=/run/secrets/password -d iotagent4fiware/iotagent-opcua
```

Currently, this `_FILE` suffix is supported for:

-   `IOTA_AUTH_USER`
-   `IOTA_AUTH_PASSWORD`
-   `IOTA_AUTH_CLIENT_ID`
-   `IOTA_AUTH_CLIENT_SECRET`
-   `IOTA_MONGO_USER`
-   `IOTA_MONGO_PASSWORD`

## Best Practices

### Increase ULIMIT in Docker Production Deployments

Default settings for ulimit on a Linux system assume that several users would share the system. These settings limit the
number of resources used by each user. The default settings are generally very low for high performance servers and
should be increased. By default, we recommend, that the IoTAgent - UL server in high performance scenarios, the
following changes to ulimits:

```console
ulimit -n 65535        # nofile: The maximum number of open file descriptors (most systems do not allow this
                                 value to be set)
ulimit -c unlimited    # core: The maximum size of core files created
ulimit -l unlimited    # memlock: The maximum size that may be locked into memory
```

If you are just doing light testing and development, you can omit these settings, and everything will still work.

To set the ulimits in your container, you will need to run IoTAgent - UL Docker containers with the following additional
--ulimit flags:

```console
docker run --ulimit nofile=65535:65535 --ulimit core=100000000:100000000 --ulimit memlock=100000000:100000000 \
--name iotagent -d iotagent4fiware/iotagent-opcua
```

Since “unlimited” is not supported as a value, it sets the core and memlock values to 100 GB. If your system has more
than 100 GB RAM, you will want to increase this value to match the available RAM on the system.

> Note: The --ulimit flags only work on Docker 1.6 or later. Nevertheless, you have to "request" more resources (i.e.
> multiple cores), which might be more difficult for orchestrates ([Docker Engine](https://docs.docker.com/engine) or
> [Kubernetes](https://kubernetes.io)) to schedule than a few different containers requesting one core (or less...) each
> (which it can, in turn, schedule on multiple nodes, and not necessarily look for one node with enough available
> cores).

If you want to get more details about the configuration of the system and node.js for high performance scenarios, please
refer to the [Installation Guide](https://fiware-iotagent-ul.rtfd.io/en/latest/installationguide/index.html).

### Set-up appropriate Database Indexes

If using Mongo-DB as a data persistence mechanism (i.e. if `IOTA_REGISTRY_TYPE=mongodb`) the device and service group
details are retrieved from a database. The default name of the IoT Agent database is `iotagentopcua`. Database access
can be optimized by creating appropriate indices.

For example:

```console
docker exec  <mongo-db-container-name> mongo --eval '
    conn = new Mongo();
    db = conn.getDB("iotagentul");
    db.createCollection("devices");
    db.devices.createIndex({"_id.service": 1, "_id.id": 1, "_id.type": 1});
    db.devices.createIndex({"_id.type": 1});
    db.devices.createIndex({"_id.id": 1});
    db.createCollection("groups");
    db.groups.createIndex({"_id.resource": 1, "_id.apikey": 1, "_id.service": 1});
    db.groups.createIndex({"_id.type": 1});' > /dev/null
```

The name of the database can be altered using the `IOTA_MONGO_DB` environment variable. Alter the `conn.getDB()`
statement above if an alternative database is being used.
