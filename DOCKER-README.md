# F4I OPC UA Agent

An Internet of Things Agent accepting data from OPC UA devices. This IoT Agent is designed to be a bridge between the
OPC Unified Architecture protocol and the
[NGSI](https://swagger.lab.fiware.org/?url=https://raw.githubusercontent.com/Fiware/specifications/master/OpenAPI/ngsiv2/ngsiv2-openapi.json)
interface of a context broker.

The intended level of complexity to support these operations should consider a limited human intervention (mainly during
the setup of a new OPC UA endpoint), through the mean of a parametrization task (either manual or semi-automatic, using
a text-based parametrization or a simple UI to support the configuration) so that no software coding is required to
adapt the agent to different OPC UA devices.

It is based on the [IoT Agent Node.js Library](https://github.com/telefonicaid/iotagent-node-lib). Further general
information about the FIWARE IoT Agents framework, its architecture and the common interaction model can be found in the
library's GitHub repository.

This project is part of [FIWARE](https://www.fiware.org/). For more information check the FIWARE Catalogue entry for the
[IoT Agents](https://github.com/Fiware/catalogue/tree/master/iot-agents).

## How to build a Docker image

Building a new Docker image for the OPC-UA IotAgent can be useful if you want to integrate your changes without relying
on Docker volumes.

The operation is quite easy:

```bash
cd iotagent-opcua
docker build -t <registry-name/hub-user>/<repo-name>:<version-tag> .

Example:
docker build -t johndoe/opcuaDoeAgent:1.0 .
```

Be aware that using an existing Docker Hub username is required to push the image to Docker Hub

#### Behind proxy

Assuming **http_proxy** environment variable is available for the current shell, run:

```bash
docker build --build-arg http_proxy=$http_proxy --build-arg https_proxy=$http_proxy -t <registry-name/hub-user>/<repo-name>:<version-tag> .
```

If this variable is not set, then before running the above command execute:

```bash
export http_proxy='http://<proxy-user>:<proxy-password>@<proxy-host>:<proxy-port>'
```

### Docker Secrets

Coming soon ... IDM ...
