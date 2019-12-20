#!/bin/bash

docker-compose -f ./tests/docker-compose.yml up -d iotcarsrv

#while [ $(docker ps | grep -c 'iotcarsrv') -lt 1 ]
#do
# echo "Wait for carsrv to start ... "
# sleep 0.5
#done

while [ $(docker-compose -f ./tests/docker-compose.yml logs iotcarsrv | grep -c 'Server is now listening ') -lt 1 ]
do
 echo "Wait for carsrv to start ... "
 sleep 0.5
done