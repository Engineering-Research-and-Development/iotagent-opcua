# OPC UA Agent Installation & Administration Guide


### Docker - Fastest Way - Recommended
The **docker-first** approach provides you with all the needed component: OCB, Mongo instances and a sample OPC-UA server.

A step-by-step tutorial is available [here](https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/docs/opc_ua_agent_tutorial.md)

### NPM
Before launching the Agent you must install Orion Context Broker and a OPC UA Server. After that you must tell the Agent
how to interact with these components by using config.properties file.
Once configuration is complete you can execute these commands to run the Agent.

##### Download

Firstly, download git source project

```bash
git clone "https://github.com/Engineering-Research-and-Development/iotagent-opcua"
```

##### Install

Then, launch npm install process in order to download and install all dependencies.

```bash
cd iotagent-opcua
npm install
```

##### Run

Finally, run the agent.

```bash
node index.js
```

---
