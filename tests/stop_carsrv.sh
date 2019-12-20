#!/bin/bash

docker-compose -f ./tests/docker-compose.yml stop iotcarsrv

while [ $(docker ps | grep -c 'iotcatsrv') -gt 0 ]
do
 echo "Wait for carsrv to stop ... "
 sleep 0.5
done