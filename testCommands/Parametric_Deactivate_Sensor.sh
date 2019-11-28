#!/bin/bash

# $1: sensor index
# $2: context type
# $3: context id

echo "
# age01_Car activating sensor..."

curl -s -X POST --noproxy "*" http://localhost:1026/v1/updateContext \
  -H 'accept: application/json' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /demo' \
  -d '{
        "contextElements": [
            {
               "type": "'$2'",
                "isPattern": "false",
                "id": "'$3'",
                "attributes": [
                	{
                		"name":"DeactivateSensor",
                		"type":"command",
                		"value":['$1']
                	}
                ]
            }
        ],
        "updateAction": "UPDATE"
    }'
