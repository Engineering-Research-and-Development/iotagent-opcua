## Connecting the OPC UA IoTAgent to an external OPC UA Server

In this section you find all what you need to know about linking the OPC UA IoTAgent to an external OPC UA Server.

## Step 1 - Configure the Agent

First of all, you have to inform the Agent of where it can find the other components. IP addresses, hostnames, ports and
all the other required properties must be specified within config.js file.

![edit config.js](./images/OPC%20UA%20agent%20flow%20chart_1.png)

Details about all the properties in config.js are explained in the [config.js](../conf/config.js) template.

If you are using the dockerized version, you do not have to change the hostnames/port pairs, we will see how to map that
symbolic names to actual IP addresses in the next section.

## Step 2 - Map IP addresses

When using an external OPC UA Server the Agent (and the built-in mapping tool) needs to know the address of the OPC UA
Server. You have to map the OPC UA Server address against two hostnames.

```yaml
services:
  iot-agent:
    ...
    extra_hosts:
      - "iotcarsrv:<opc-ua-car-server-IP-ADDRESS>"
      - "<opc-ua-server-hostname>:<opc-ua-car-server-IP-ADDRESS>"
    ...
```

The first line of `extra_hosts` section is used by the Agent during the communication with the OPC UA Server. The second
one is needed when the OPC UA Server answers to the mapping tool returning its hostname.

## Step 3 - Preparing the Agent for start up

OPC UA Agent is configurable through a single configuration file. All properties are explained in the
[config.js](../conf/config.js) template. If you are running the Agent using Docker, please use the environment variables
defined in the docker-compose example provided.

Main sections are:

-   `config.iota`: configure northbound (Context Broker), agent server, persistence (MongoDB), log level, etc.
-   `config.opcua`: configure southbound (OPC UA endpoint)
-   `config.mappingTool`: configure mapping tool properties to set auto configuration

Three options are available to configure the Agent, described below.

![edit config.js](./images/OPC%20UA%20agent%20flow%20chart_2.png)

#### Option 1: Auto configuration (usage of Mapping Tool)

When `config.configurationType` is `auto`, the Mapping Tool creates a mapping for all OPC UA objects (except those with
namespace to ignore matching): all OPC UA variables will be configured as active attributes whereas all OPC UA methods
will be configured as commands.

#### Option 2: Static configuration (editing config.js file)

When `config.configurationType` is `static`, it is possible to specify the mapping between OPC UA objects and NGSI
attributes and commands. The mapping can be specified in the config.js, editing the properties `types`, `contexts` and
`contextSubscriptions`.

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

An example can be found [here](../conf/config-v2.example.js).

#### Option 3: Dynamic configuration (REST API)

When `config.configurationType` is `dynamic`, you can use the REST interface to setup the Agent once it has started. To
provision a new device have a look at Step 4
[here](https://iotagent-opcua.readthedocs.io/en/latest/opc_ua_agent_tutorial.html#step-by-step-tutorial).

## Step 4 - Run the Agent

Assuming the OPC UA Server is running, execute:

```bash
cd docker
docker-compose up -d
```

## Security

According to the OPC UA Security Model the OPC UA IotAgent, acting as an OPC UA Client, can specify a "Security Policy"
and a "Security Mode". Nevertheless, these requests must find a match with the OPC UA Server policies.

You can specify the Security Policy/Mode pair through the `config.js`.

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

In the `docker-compose.yml` you can mount `certificates` volume inside the `iot-agent` service. The `certificates`
folder contains files you can overwrite with yours.
