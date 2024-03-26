### How to install

Firstly, launch npm install process in order to download and install all dependencies.

```
npm install
```

### How to configure

OPC UA Agent is configurable through a single configuration file. All properties are explained in the
[config.js](../conf/config.js) template.

Main sections are:

-   `config.iota`: configure northbound (Context Broker), agent server, persistence (MongoDB), log level, etc.
-   `config.opcua`: configure southbound (OPC UA endpoint)
-   `config.mappingTool`: configure mapping tool properties to set auto configuration

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

### Run

Finally, run the agent.

```
node bin/iotagent-opcua
```
