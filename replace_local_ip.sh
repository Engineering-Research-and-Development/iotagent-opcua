#!/bin/bash

MACHINE_IP=$(hostname -I | cut -d ' ' -f 1)

sed -i "s/TEST_MACHINE_IP/$MACHINE_IP/g" conf/config.properties
sed -i "s/TEST_MACHINE_IP/$MACHINE_IP/g" conf/config.json