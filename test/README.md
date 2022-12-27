# FIWARE IoT Agent for a OPCUA Protocol

## Unit tests

The [unit](./unit) folder contains all the unit tests to be run with nyc and mocha.

```console
$ npm run test:unit
```

## Functional tests

The folder contains all the functional tests to be run with nyc and mocha. They make use of a test environment composed
by [opc-ua-car-server](https://github.com/Engineering-Research-and-Development/opc-ua-car-server),
[fiware-orion](https://github.com/telefonicaid/fiware-orion), [mongo](https://github.com/mongodb/mongo) and the OPCUA
IoT Agent.

The test environment is set up using this [docker-compose-test.yml](./docker-compose-test.yml), so before running functional
tests, ensure TCP ports 27017, 1026, 5001, 4041 used by services mentioned above are free to use on the host machine.

```console
$ npm run test:functional
```

## Integration tests

The folder contains all the integration tests to be run with nyc and mocha. They make use of a test environment composed
by [opc-ua-car-server](https://github.com/Engineering-Research-and-Development/opc-ua-car-server),
[fiware-orion](https://github.com/telefonicaid/fiware-orion), [mongo](https://github.com/mongodb/mongo) and the OPCUA
IoT Agent.

The test environment is set up using this [docker-compose-test.yml](./docker-compose-test.yml), so before running integration
tests, ensure TCP ports 27017, 1026, 5001, 4041 used by services mentioned above are free to use on the host machine.

```console
$ npm run test:integration
```

## Requirements

-   Docker Engine
-   docker-compose
-   Node version 16.15.0 or higher
-   Unix Bash
