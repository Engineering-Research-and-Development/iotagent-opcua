#!/usr/bin/env node

/*
 * Copyright 2022 Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opcua
 *
 * iotagent-opcua is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-opcua is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-opcua.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contact@eng.it]
 */

const http = require('http');
const port = process.env.IOTA_NORTH_PORT || '4041';
const path = process.env.HEALTHCHECK_PATH || '/iot/about';
const httpCode = process.env.HEALTHCHECK_CODE || 200;

const options = {
    host: 'localhost',
    port,
    timeout: 2000,
    method: 'GET',
    path
};

const request = http.request(options, (result) => {
    // eslint-disable-next-line no-console
    console.info(`Performed health check, result ${result.statusCode}`);
    if (result.statusCode === httpCode) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

request.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while performing health check, error: ${err}`);
    process.exit(1);
});

request.end();
