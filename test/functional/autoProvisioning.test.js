const { expect, assert } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const child = require('child_process');
const path = require('path');
const axios = require('axios');

/**
 * Contains the current child process of the agent
 * @type {null}
 */
let agentProcess = null;

/**
 * If true, start and stop an agent instance for each test block
 * @type {boolean}
 */
const MOCK_AGENT_PROCESS = true;

/**
 * If true, start and stop an environment (opcua car server, orion, mongodb) for each test block using docker
 * @type {boolean}
 */
const MOCK_ENVIRONMENT = true;

/**
 * Start the agent in a child process using configuration file passed as argument
 * @param testConfigFile
 * @returns {ChildProcessWithoutNullStreams}
 */
function startAgent(testConfigFile) {
    console.log('>>>>> STARTING AGENT <<<<<');
    agentProcess = child.spawn('node', ['./bin/iotagent-opcua', `./test/functional/mock/${testConfigFile}`]);
    agentProcess.stdout.setEncoding('utf8');
    agentProcess.stdout.on('data', function (data) {
        console.log('AGENT_LOG: ' + data);
    });
    agentProcess.stderr.setEncoding('utf8');
    agentProcess.stderr.on('data', function (data) {
        console.error('AGENT_ERR: ' + data);
    });
    return agentProcess;
}

/**
 * Stop the child process of the agent
 * @param process
 */
function stopAgent(process) {
    console.log('>>>>> STOPPING AGENT <<<<<');
    process.kill('SIGINT');
}

async function wait(seconds) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

describe('IoT Agent OPCUA autoprovisioning', () => {
    describe('When autoprovisioning is enabled', () => {
        describe('When providing empty device information on config.js', () => {
            before(async () => {
                if (MOCK_ENVIRONMENT) {
                    await exec(path.resolve(__dirname, '../start-env.sh'));
                }
                if (MOCK_AGENT_PROCESS) {
                    startAgent('config-v2-no-device.test.js');
                }
            });
            after(async () => {
                if (MOCK_ENVIRONMENT) {
                    await exec(path.resolve(__dirname, '../stop-env.sh'));
                }
                if (MOCK_AGENT_PROCESS) {
                    stopAgent(agentProcess);
                }
            });
            it('Should run the mapping tool and perform autoprovisioning of service group', async () => {
                await wait(20);
                const mockConfig = require('./mock/config-v2-no-device.test');
                const url = `${mockConfig.iota.providerUrl}/iot/services`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.services.length).is.greaterThanOrEqual(1);
                    expect(res.data.services[0].service).to.equal(mockConfig.iota.service);
                    expect(res.data.services[0].subservice).to.equal(mockConfig.iota.subservice);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /iot/services failed ${err}`);
                }
            });
            it('Should run the mapping tool and perform autoprovisioning of devices', async () => {
                await wait(5);

                const mockConfig = require('./mock/config-v2-no-device.test');
                const url = `${mockConfig.iota.providerUrl}/iot/devices`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.count).is.greaterThanOrEqual(1);
                    expect(res.data.devices.length).is.greaterThanOrEqual(1);
                    expect(res.data.devices[0].entity_name).to.equal(mockConfig.opcua.entityId);
                    expect(res.data.devices[0].entity_type).to.equal(mockConfig.opcua.entityType);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /iot/devices failed ${err}`);
                }
            });
        });

        describe('When providing device information on config.js', () => {
            before(async () => {
                if (MOCK_ENVIRONMENT) {
                    await exec(path.resolve(__dirname, '../start-env.sh'));
                }
                if (MOCK_AGENT_PROCESS) {
                    startAgent('config-v2.test.js');
                }
            });
            after(async () => {
                if (MOCK_ENVIRONMENT) {
                    await exec(path.resolve(__dirname, '../stop-env.sh'));
                }
                if (MOCK_AGENT_PROCESS) {
                    stopAgent(agentProcess);
                }
            });
            it('Should perform autoprovisioning of service group', async () => {
                await wait(10);

                const mockConfig = require('./mock/config-v2.test');
                const url = `${mockConfig.iota.providerUrl}/iot/services`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.services.length).is.greaterThanOrEqual(1);
                    expect(res.data.services[0].service).to.equal(mockConfig.iota.service);
                    expect(res.data.services[0].subservice).to.equal(mockConfig.iota.subservice);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /iot/services failed ${err}`);
                }
            });
            it('Should perform autoprovisioning of devices', async () => {
                await wait(10);

                const mockConfig = require('./mock/config-v2.test');
                const url = `${mockConfig.iota.providerUrl}/iot/devices`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.count).is.greaterThanOrEqual(1);
                    expect(res.data.devices.length).is.greaterThanOrEqual(1);
                    expect(res.data.devices[0].device_id).to.equal(mockConfig.iota.contexts[0].id);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /iot/devices failed ${err}`);
                }
            });
        });
    });
});
