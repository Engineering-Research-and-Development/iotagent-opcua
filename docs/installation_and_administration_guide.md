# OPC UA Agent Installation & Administration Guide

### Docker - Fastest Way - Recommended

The **docker-first** approach provides you with all the needed component: OCB, Mongo instances and a sample OPC-UA
server.

A step-by-step tutorial is available [here](./opc_ua_agent_tutorial.md)

### NPM

Before launching the Agent you must install Orion Context Broker and a OPC UA Server. After that you must tell the Agent
how to interact with these components by using config.js file. Once configuration is complete you can execute these
commands to run the Agent.

##### Step 1 - Download

Firstly, download git source project

```bash
git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua"
cd iotagent-opcua
```

##### Step 2 - Configure the environment

Open the `conf/config.js` and make your changes (see how to do this [here](howto.md)).

##### Step 3 - Configure device

The downloaded repository comes with a `config.js` (conf/config.js) in which an empty Device is preloaded.

At this point, you have three options for the configuration:

-   `auto`: use the mapping tool to automatically generate a `config.js`
-   `static`: define your own context mappings in fields `types`, `contexts`, `contextSubscriptions`, `events` in
    `config.js`
-   `dynamic`: dynamically provision the new Device (mapping between OPC UA Server and OPC UA Agent) via REST interface

If you want to use the mapping tool simply set as empty the following properties in the config.js:

-   `types: {}`
-   `contexts: []`
-   `contextSubscriptions: []`
-   `events: []`

When you launch the Agent, the mapping tool will automatically be triggered and will extract the above properties of the
`config.js` you need using the information contained on the rest of the file. Be sure the addresses contained inside the
`config.js` are the correct ones.

If you want to use the REST interface have a look at Step 4
[here](https://iotagent-opcua.readthedocs.io/en/latest/opc_ua_agent_tutorial.html#step-by-step-tutorial) to see how to
provision a new device.

##### Step 4 - Install the npm packages

```bash
npm install
```

##### Step 5 - Run the agent

```bash
node bin/iotagent-opcua
```

##### Step 6 - Check the device configuration

Run the following command to get the loaded device. In this way you will know if the OPCUA Server -> OPCUA Agent mapping
has been established successfully (change headers if needed):

```bash
curl http://localhost:4041/iot/devices -H "fiware-service: opcua_car" -H "fiware-servicepath: /demo"
```
