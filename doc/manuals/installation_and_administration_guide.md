# OPC UA Agent Installation & Administration Guide
### Download 
Firstly, download git source project
```
git clone "https://github.com/is3labengrd/iotagent-opcua"
```

### Install 
Then, launch npm install process in order to download and install all dependencies.
```
cd iotagent-opcua
npm install
```

### Run
Finally, run the agent.
```
node index.js
```

### Sanity Check
In order to check if the agent is running and up, make curl request (api-port has to match with the parameter inside config.properties file). 
```
curl -X GET http://localhost:{api-port}/version 
```
