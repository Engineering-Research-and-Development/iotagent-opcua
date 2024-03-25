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
-   `config.autoprovision`: flag indicating whether or not to provision the Service Group and Device automatically when
    measures arrive

##### Auto provisioning

Setting property `autoprovision` in the config.js to `false`, a manual provisioning can be performed using
iotagent-node-lib [API](https://github.com/telefonicaid/iotagent-node-lib/blob/master/doc/api.md) interfaces.

Setting property `autoprovision` in the config.js to `true`, the OPC UA Agent will perform autoprovisioning when
measures arrive.

#### Auto Configuration (usage of Mapping Tool)

When `config.mappingTool.enabled` is `true` and `config.iota.types` is empty, the Mapping Tool creates a mapping for all
OPC UA objects (except those with namespace to ignore matching): all OPC UA variables will be configured as active
attributes whereas all OPC UA methods will be configured as commands.

To enable auto configuration, simply set as empty the following properties in the config.js:

-   `types: {}`
-   `contexts: []`
-   `contextSubscriptions: []`

and enable the mapping tool:

-   `mappingTool: { enabled: true, ... }`

#### Manual Configuration (editing config.js file)

Using Manual Configuration it is possible to specify the mapping between OPC UA objects and NGSI attributes and
commands. The mapping can be specified in the config.js, editing the properties `types`, `contexts` and
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

#### Dynamic configuration (REST API)

If you want to use the REST interface have a look at Step 4
[here](https://iotagent-opcua.readthedocs.io/en/latest/opc_ua_agent_tutorial.html#step-by-step-tutorial) to see how to
provision a new device.

### Run

Finally, run the agent.

```
node bin/iotagent-opcua
```
