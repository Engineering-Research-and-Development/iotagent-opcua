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

##### Step 2 - Configure the environment
Open the ```conf/config.properties``` and make your changes (see how to do this [here](https://iotagent-opcua.readthedocs.io/en/latest/user_and_programmers_manual/index.html)).

##### Step 3 - Configure device
The downloaded repository comes with a ```config.json``` (conf/config.json) in which an empty Device is preloaded.

At this point, you have two options:
- Use the mapping tool to automatically generate a ```config.json```
- Provision the new Device (mapping between OPC UA Server and OPC UA Agent) via REST interface

If you want to use the mapping tool simply delete the existing config.json. When you launch the Agent, the mapping tool will automatically be triggered and will extract the ```config.json``` you need using the information contained inside the ```config.properties``` file.
Be sure the addresses contained inside the ```config.json``` are the correct ones.

If you want to use the REST interface have a look at Step 4 [here](https://iotagent-opcua.readthedocs.io/en/latest/opc_ua_agent_tutorial/index.html#step-by-step-tutorial) to see how to provision a new device.
Then set your local ip address inside ```config.json``` by running the ```./iotagent-opcua/replace_local_ip.sh``` script.

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

