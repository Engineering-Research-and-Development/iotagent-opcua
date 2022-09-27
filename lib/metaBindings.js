const config = require('./configService');
const http = require('http');
const context = {
    op: 'IoTAgentOPCUA.OPCUABinding'
};
const url = require('url');

/**
 * Create the mongo group if not existing, using config.js information
 */
function createGroup() {
    return new Promise((resolve, reject) => {
        const body = {
            services: [
                {
                    apikey: config.getConfig().defaultKey,
                    cbroker: `http://${config.getConfig().iota.contextBroker.host}:${config.getConfig().iota.contextBroker.port}`,
                    entity_type: config.getConfig().iota.defaultType,
                    resource: config.getConfig().iota.defaultResource
                }
            ]
        };
        const q = url.parse(config.getConfig().iota.providerUrl, true);
        const options = {
            host: q.hostname,
            port: q.port,
            path: '/iot/services',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'fiware-service': config.getConfig().iota.service,
                'fiware-servicepath': config.getConfig().iota.subservice
            }
        };
        httpRequest(options, body)
            .then(function () {
                resolve(true);
            })
            .catch(function (err) {
                // http code 409 = Resource already exists
                if (err.message.includes('statusCode=409')) {
                    resolve(true);
                } else {
                    reject(err);
                }
            });
    });
}

/**
 * Create the device if not existing, using config.js information
 */
function createDevices() {
    return new Promise((resolve, reject) => {
        const devices = [];
        const contexts = config.getConfig().iota.contexts;
        for (const c of contexts) {
            const device = {
                device_id: c.id,
                entity_name: c.id,
                entity_type: c.type,
                apikey: config.getConfig().defaultKey,
                service: config.getConfig().service,
                subservice: config.getConfig().subservice,
                attributes: config.getConfig().iota.types[c.type].active,
                lazy: config.getConfig().iota.types[c.type].lazy,
                commands: config.getConfig().iota.types[c.type].commands,
                endpoint: config.getConfig().opcua.endpoint
            };
            devices.push(device);
        }

        const body = {
            devices
        };
        const q = url.parse(config.getConfig().iota.providerUrl, true);
        const options = {
            host: q.hostname,
            port: q.port,
            path: '/iot/devices',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'fiware-service': config.getConfig().iota.service,
                'fiware-servicepath': config.getConfig().iota.subservice
            }
        };
        httpRequest(options, body)
            .then(function () {
                resolve(true);
            })
            .catch(function (err) {
                // http code 409 = Resource already exists
                if (err.message.includes('statusCode=409')) {
                    resolve(true);
                } else {
                    reject(err);
                }
            });
    });
}

function httpRequest(options, postData) {
    return new Promise(function (resolve, reject) {
        const req = http.request(options, function (res) {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            let body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

/**
 * Make auto-provisioning of Group and Device
 */
async function performAutoProvisioning() {
    const createGroupResult = await createGroup();
    const createDevicesResult = await createDevices();

    if (createGroupResult !== true) {
        config.getLogger().error(context, 'GLOBAL: Error on group provisioning.');
        throw new Error(createGroupResult);
    }

    if (createDevicesResult !== true) {
        config.getLogger().error(context, 'GLOBAL: Error on devices provisioning.');
        throw new Error(createDevicesResult);
    }
}

exports.performAutoProvisioning = performAutoProvisioning;
