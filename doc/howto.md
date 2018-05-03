### Install 
Firstly, launch npm install process in order to download and install all dependencies.
```
npm install
```
### Configure

#### Auto Configuration (using of Mapping Tool)
Then, configure the properties file in order to set parameters about North side (Context Broker), agent server and South side (OPC UA endpoint).
```
#SOUTHBOUND CONFIGURATION (OPC-UA)
#Namespace to ignore
namespace-ignore=2,7
#OPC-UA Endpoint
endpoint=opc.tcp://localhost:4334/UA/MillingMachine

#NORTHBOUND CONFIGURATION (ORION CB)
context-broker-host=192.168.56.101
context-broker-port=1026
fiware-service=opcua
fiware-service-path=/boost

#AGENT SERVER CONFIGURATION
server-base-root=/
server-port=4041
device-registry-type=memory
provider-url=http://192.168.56.1:4041
device-registration-duration=P1M
log-level=INFO
#MongoDB Agent Config
mongodb-host=192.168.56.101
mongodb-port=27017
mongodb-db=iotagent
mongodb-retries=5
mongodb-retry-time=5
```
Using of Auto Configuration create a mapping for all OPC-UA objects (except those with namespace to ignore matching): all OPC-UA variables will be configured as active attributes whereas all OPC-UA methods will be configured as commands. It is possible modify configuration output (config.json file in same path) manually in order to drop some attributes/command or add lazy attributes. 

### Run
Finally, run the agent.
```
node index.js
```
