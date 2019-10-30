# OPC UA Agent Installation & Administration Guide


### Docker - Fastest Way - Recommended
The **docker-first** approach provides you with all the needed component: OCB, Mongo instances and a sample OPC-UA server.

A step-by-step tutorial is available [here](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/opc_ua_agent_tutorial.md)

### NPM
Before launching the Agent you must install Orion Context Broker and a OPC UA Server. After that you must tell the Agent
how to interact with these components by using config.properties file.
Once configuration is complete you can execute these commands to run the Agent.

##### Step 1 - Download

Firstly, download git source project

```bash
git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua"
```

##### Step 2 - Configure
The downloaded repository comes with a ```config.json``` in which a configuration for a test OPC UA Server is preloaded.

You need a config.json for your OPC UA Server, so discard the existing one and read this on how to generate a config.json using the mapping tool.

Once you have obtained your ```config.json```, insert it into the ```iotagent-opcua/conf``` folder.
Be sure the addresses contained inside the ```config.json``` are the correct ones.

##### Step 3 - Install the npm packages

```bash
cd iotagent-opcua
npm install
```

##### Step 4 - Run the agent

```bash
node index.js
```
