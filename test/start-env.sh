#!/bin/bash

mongodb_status=$(docker-compose -f ./test/docker-compose-test.yml logs mongodb | grep -c 'waiting for connections on port')
iotcarsrv_status=$(docker-compose -f ./test/docker-compose-test.yml logs mongodb | grep -c 'waiting for connections on port')
orion_status=$(docker-compose -f ./test/docker-compose-test.yml logs mongodb | grep -c 'waiting for connections on port')

if [ $mongodb_status -gt 0 ] && [ $mongodb_status -gt 0 ] && [ $orion_status -gt 0 ]; then
 echo "Test environment already up and running"
 exit 0
fi

docker-compose -f ./test/docker-compose-test.yml up -d

while [ $(docker-compose -f ./test/docker-compose-test.yml logs mongodb | grep -c 'waiting for connections on port') -lt 1 ]
do
 echo "Wait for mongodb to start ... "
 sleep 0.5
done

while [ $(docker-compose -f ./test/docker-compose-test.yml logs iotcarsrv | grep -c 'Server is now listening') -lt 1 ]
do
 echo "Wait for iotcarsrv to start ... "
 sleep 0.5
done

while [ $(docker-compose -f ./test/docker-compose-test.yml logs orion | grep -c 'Startup completed') -lt 1 ]
do
 echo "Wait for orion to start ... "
 sleep 0.5
done
