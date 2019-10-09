#!/bin/bash

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
               "type": "Device",
                "isPattern": "false",
                "id": "age01_Car",
                "attributes": [
                	{
                		"name":"ActivateSensor",
                		"type":"command",
                		"value":['$1']
                	}
                ]
            }
        ],
        "updateAction": "UPDATE"
    }'
