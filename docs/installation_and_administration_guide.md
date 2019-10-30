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
cd iotagent-opcua
```

##### Step 2 - Configure device
The downloaded repository comes with a ```config.json``` (conf/config.json) in which a configuration for a test OPC UA Server is preloaded.

You need a ```config.json``` for your OPC UA Server, so discard the existing one. When you launch the Agent, a mapping tool will automatically be triggered and will extract the ```config.json``` you need.
Be sure the addresses contained inside the ```config.json``` are the correct ones.

##### Step 3 - Configure the environment
Open the ```conf/config.properties``` and make your changes (see how to do this here).

##### Step 4 - Install the npm packages

```bash
npm install
```

##### Step 5 - Run the agent

```bash
node index.js
```
##### Step 6 - Check the device configuration 
Run the following command to get the loaded device. In this way you will know if the OPCUA Server -> OPCUA Agent mapping has been established successfully (change headers if needed):

```bash
curl http://localhost:4003/iot/devices -H "fiware-service: opcua_car" -H "fiware-servicepath: /demo"
```

