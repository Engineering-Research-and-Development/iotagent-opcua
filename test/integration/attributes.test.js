const { expect, assert } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const child = require('child_process');
const path = require('path');
const axios = require('axios');
const mockConfig = require('./mock/config-v2.test');
const mockCommandWithArgumentOrion = require('./mock/executeCommandWithArguments.orion.request.json');
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

describe('IoT Agent OPCUA attributes values integration with context broker', () => {
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

    describe('When monitored attribute value changes', () => {
        it('Should send updated value to context broker', async () => {
            await wait(40);
            const mockConfig = require('./mock/config-v2.test');

            // Query attribute to context broker
            const attrName = 'Engine_Oxigen';
            let attrValue = 0;
            let url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
            try {
                const res = await axios.get(url, {
                    headers: {
                        'fiware-service': mockConfig.iota.service,
                        'fiware-servicepath': mockConfig.iota.subservice
                    }
                });
                expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                attrValue = res.data.value;
            } catch (err) {
                assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
            }

            await wait(10);

            // Execute Accelerate command to trigger value change on Engine_Oxigen
            const mockCommand = require('./mock/executeCommandWithArguments.request.json');
            url = `${mockConfig.iota.providerUrl}//op/update`;
            try {
                const res = await axios.post(url, mockCommand, {
                    headers: {
                        'fiware-service': mockConfig.iota.service,
                        'fiware-servicepath': mockConfig.iota.subservice
                    }
                });
                expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
            } catch (err) {
                assert.fail('Request failed', 'Request success', `POST //op/update failed ${err}`);
            }

            await wait(20);

            // Query new value of attribute to context broker
            url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
            try {
                const res = await axios.get(url, {
                    headers: {
                        'fiware-service': mockConfig.iota.service,
                        'fiware-servicepath': mockConfig.iota.subservice
                    }
                });
                expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                expect(attrValue).to.not.equal(res.data.value);
            } catch (err) {
                assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
            }
        });
    });

    describe('When context broker query a lazy attribute', () => {
        it('Should return value retrieved from device', async () => {
            await wait(20);
            const mockConfig = require('./mock/config-v2.test');

            // Query lazy attribute to context broker
            const attrName = 'Speed';
            const url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
            try {
                const res = await axios.get(url, {
                    headers: {
                        'fiware-service': mockConfig.iota.service,
                        'fiware-servicepath': mockConfig.iota.subservice
                    }
                });
                expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                expect(res.data.type).is.equal('Number');
                expect(typeof res.data.value).is.equal('number');
            } catch (err) {
                assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
            }
        });
    });

    describe('When context broker execute a command', () => {
        it('Should execute command on device', async () => {
            await wait(20);
            const mockConfig = require('./mock/config-v2.test');
            const mockCommandWithArgumentOrion = require('./mock/executeCommandWithArguments.orion.request.json');
            const mockCommandNoArgumentOrion = require('./mock/executeCommandWithNoArguments.orion.request.json');

            // Execute command from context broker with single argument (Accelerate)
            const attrName = 'Accelerate';
            let url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
            try {
                const res = await axios.put(url, mockCommandWithArgumentOrion, {
                    headers: {
                        'fiware-service': mockConfig.iota.service,
                        'fiware-servicepath': mockConfig.iota.subservice
                    }
                });
                expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);

                await wait(20);

                // Query attribute to assert command execution
                const attrName = 'Speed';
                url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
                try {
                    const res = await axios.get(url, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data.value).is.lessThan(150);

                    const speedValue = res.data.value;

                    // Execute command from context broker with no argument (Stop)
                    const attrName = 'Stop';
                    url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
                    try {
                        const res = await axios.put(url, mockCommandNoArgumentOrion, {
                            headers: {
                                'fiware-service': mockConfig.iota.service,
                                'fiware-servicepath': mockConfig.iota.subservice
                            }
                        });
                        expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);

                        await wait(20);

                        // Query attribute to assert command execution
                        const attrName = 'Speed';
                        url = `http://${mockConfig.iota.contextBroker.host}:${mockConfig.iota.contextBroker.port}/v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type}`;
                        try {
                            const res = await axios.get(url, {
                                headers: {
                                    'fiware-service': mockConfig.iota.service,
                                    'fiware-servicepath': mockConfig.iota.subservice
                                }
                            });
                            expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                            expect(res.data.value).is.not.equal(speedValue);
                        } catch (err) {
                            assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
                        }
                    } catch (err) {
                        assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
                    }
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
                }
            } catch (err) {
                assert.fail('Request failed', 'Request success', `GET /v2/entities/${mockConfig.iota.contexts[0].id}/attrs/${attrName}?type=${mockConfig.iota.contexts[0].type} failed ${err}`);
            }
        });
    });
});
