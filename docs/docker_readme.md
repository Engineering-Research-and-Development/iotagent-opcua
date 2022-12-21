## How to build a Docker image

Building a new Docker image for the OPC-UA IotAgent can be useful if you want to integrate your changes autonomously.

```bash
cd iotagent-opcua/docker
docker build -t <registry-name/hub-user>/<repo-name>:<version-tag> .

Example:
docker build -t johndoe/opcuaDoeAgent:1.0 .
```

#### Behind a proxy

Assuming **http_proxy** environment variable is available for the current shell, run:

```bash
docker build --build-arg http_proxy=$http_proxy --build-arg https_proxy=$http_proxy -t <registry-name/hub-user>/<repo-name>:<version-tag> .
```

If this variable is not set, then before running the above command execute:

```bash
export http_proxy='http://<proxy-user>:<proxy-password>@<proxy-host>:<proxy-port>'
```
