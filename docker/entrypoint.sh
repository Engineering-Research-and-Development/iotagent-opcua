#!/bin/bash
#
# Copyright 2020 Engineering Ingegneria Informatica S.p.A.
#

# usage: file_env VAR [DEFAULT]
#    ie: file_env 'XYZ_DB_PASSWORD' 'example'
# (will allow for "$XYZ_DB_PASSWORD_FILE" to fill in the value of
#  "$XYZ_DB_PASSWORD" from a file, especially for Docker's secrets feature)
file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"
	if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
		echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
		exit 1
	fi
	local val="$def"
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(< "${!fileVar}")"
	fi
	export "$var"="$val"
	unset "$fileVar"
}

file_env 'IOTA_AUTH_HEADER'
file_env 'IOTA_AUTH_USER'
file_env 'IOTA_AUTH_PASSWORD'
file_env 'IOTA_AUTH_PERMANENT_TOKEN'
file_env 'IOTA_AUTH_ENABLED'
file_env 'IOTA_AUTH_TYPE'
file_env 'IOTA_AUTH_HOST'
file_env 'IOTA_AUTH_POST'
file_env 'IOTA_AUTH_CLIENT_ID'
file_env 'IOTA_AUTH_CLIENT_SECRET'
file_env 'IOTA_MONGO_USER'
file_env 'IOTA_MONGO_PASSWORD'


if [[  -z "$IOTA_AUTH_ENABLED" ]]; then
 echo "***********************************************"
 echo "WARNING: It is recommended to enable authentication for secure connection"
 echo "***********************************************"
else
    if  [[ -z "$IOTA_AUTH_USER" ]] || [[ -z "$IOTA_AUTH_PASSWORD" ]]; then
        echo "***********************************************"
        echo "WARNING: Default IoT Agent Auth credentials have not been overridden"
        echo "***********************************************"
    else
        echo "***********************************************"
        echo "INFO: IoT Agent Auth credentials have been overridden"
        echo "***********************************************"
    fi
fi

if [[  -z "$PM2_ENABLED" ]]; then
    echo "INFO: IoT Agent running standalone"
    node /opt/iotagent-opcua/index.js
else
    echo "***********************************************"
    echo "INFO: IoT Agent encapsulated by pm2-runtime see https://pm2.io/doc/en/runtime/integration/docker/"
    echo "***********************************************"
    pm2-runtime /opt/iotagent-opcua/index.js
fi
