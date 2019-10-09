#!/bin/bash

echo "
# age01_Car toggling sensor activation..."

curl -s -X POST --noproxy "*" http://orion:1026/v1/updateContext \
  -H 'accept: application/json' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /mes' \
  -d '{
        "contextElements": [
            {
               "type": "Car",
                "isPattern": "false",
                "id": "age01_Car",
                "attributes": [
                	{
                		"name":"ToggleSensorActivation",
                		"type":"command",
                		"value":["'$1'"]
                	}
                ]
            }
        ],
        "updateAction": "UPDATE"
    }'
