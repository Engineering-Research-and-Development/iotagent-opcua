#!/bin/bash

if [ "x$1" == "x" ] ; then
  let DELTA_VEL_SEC=2
else
  let DELTA_VEL_SEC=$1
fi

let ACC=$DELTA_VEL_SEC
echo "
# age01_Car accelerate (factor $DELTA_VEL_SEC)"
curl -X POST --noproxy "*" http://localhost:1026/v1/updateContext \
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
                    "name":"Accelerate",
                    "type":"command",
                    "value":['$ACC']
                  }
                ]
            }
        ],
        "updateAction": "UPDATE"
    }
' | python3 -m json.tool

