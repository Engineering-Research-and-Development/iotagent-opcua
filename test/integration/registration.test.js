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
    agentProcess = child.spawn('node', ['./bin/iotagent-opcua', `./test/integration/mock/${testConfigFile}`]);
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
            it('Should run the mapping tool and add entities to context broker', async () => {
                await wait(20);
                const mockConfig = require('./mock/config-v2-no-device.test');
                const url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.length).is.greaterThanOrEqual(1);
                    expect(res.data[0].id).to.equal(mockConfig.mappingTool.entityId);
                    expect(res.data[0].type).to.equal(mockConfig.mappingTool.entityType);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /v2/entities failed ${err}`);
                }
            });
            it('Should run the mapping tool and register as context provider to the context broker', async () => {
                await wait(10);

                const mockConfig = require('./mock/config-v2-no-device.test');
                const url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/registrations`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.length).is.greaterThanOrEqual(1);
                    expect(res.data[0].dataProvided.entities[0].id).to.equal(mockConfig.mappingTool.entityId);
                    expect(res.data[0].dataProvided.entities[0].type).to.equal(mockConfig.mappingTool.entityType);
                    expect(res.data[0].provider.http.url).to.equal(mockConfig.iota.providerUrl);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /v2/entities failed ${err}`);
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
            it('Should run the mapping tool and add entities to context broker', async () => {
                await wait(20);
                const mockConfig = require('./mock/config-v2.test');
                const url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.length).is.greaterThanOrEqual(1);
                    expect(res.data[0].id).to.equal(mockConfig.mappingTool.entityId);
                    expect(res.data[0].type).to.equal(mockConfig.mappingTool.entityType);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /v2/entities failed ${err}`);
                }
            });
            it('Should run the mapping tool and register as context provider to the context broker', async () => {
                await wait(10);

                const mockConfig = require('./mock/config-v2.test');
                const url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/registrations`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.length).is.greaterThanOrEqual(1);
                    expect(res.data[0].dataProvided.entities[0].id).to.equal(mockConfig.mappingTool.entityId);
                    expect(res.data[0].dataProvided.entities[0].type).to.equal(mockConfig.mappingTool.entityType);
                    expect(res.data[0].provider.http.url).to.equal(mockConfig.iota.providerUrl);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /v2/entities failed ${err}`);
                }
            });
        });
    });
});
