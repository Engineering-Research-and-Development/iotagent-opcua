#!/bin/bash

echo 'Engine_Oxigen,Engine_Temperature,Speed'
# Engine_Oxigen=10.1,Engine_Temperature=81,Speed=0

ORION_SRV_URL=orion
ORION_SVR_PORT=1026
FREEBOARD_DIR=/usr/local/apache2/htdocs

while true; do 
  curl -s -X POST $ORION_SRV_URL:$ORION_SVR_PORT/v1/queryContext \
  -H 'accept: application/json' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'fiware-service: opcua_car' \
  -H 'fiware-servicepath: /mes' \
  -d '{
        "entities": [
          {
            "isPattern": "false",
            "id": "age01_Car",
            "type": "Car"
          }
        ],
        "attributes": [ "Speed", "Engine_Temperature", "Engine_Oxigen", "EngineStopped", "Acceleration", "GPSDataSensor", "ASRSensor", "ECUClockSensor", "GPSDataSensorStatus", "ASRSensorStatus", "ECUClockSensorStatus" ]
  }' | python3 -m json.tool | grep '"name":\|"value":' | sed 's/^ *//g' | sed 's/"name": /,/g' | sed 's/"value": //g' | sed 's/,$/:/g' > /tmp/newdata

echo "{$(cat /tmp/newdata)}]" | tr -d '\n' | sed 's/]$/\n/g'  | sed "s/^{,/{/g" | sed "s/\.[0-9]\+,/,/"  > $FREEBOARD_DIR/carstatus.json
  sleep 1
done
rm /tmp/newdata
exit

