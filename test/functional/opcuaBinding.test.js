const { expect, assert } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const child = require('child_process');
const path = require('path');
const axios = require('axios');
const mockConfig = require('./mock/config-v2.test');
const mockCommand = require('./mock/executeCommandWithArguments.request.json');
const mockLazyQuery = require('./mock/queryLazyAttribute.request.json');

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

describe('IoT Agent OPCUA OPCUA binding', () => {
    describe('When agent is connected to device', () => {
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
        describe('When query a lazy attribute using API', () => {
            it('Should return value retrieved from device', async () => {
                await wait(10);
                const mockConfig = require('./mock/config-v2.test');
                const mockLazyQuery = require('./mock/queryLazyAttribute.request.json');
                const url = `http://localhost:${mockConfig.iota.server.port}//op/query`;
                try {
                    const res = await axios.post(url, mockLazyQuery, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                    expect(res.data[0]).to.not.equal(undefined);
                    expect(res.data[0].Speed).to.not.equal(undefined);
                    expect(res.data[0].Speed.value).to.equal(0);
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `POST //op/query failed ${err}`);
                }
            });
        });
        describe('When executing commands using API', () => {
            it('Should execute commands on device', async () => {
                await wait(5);
                const mockConfig = require('./mock/config-v2.test');
                const mockCommandWithArgument = require('./mock/executeCommandWithArguments.request.json');
                const mockCommandNoArgument = require('./mock/executeCommandWithNoArguments.request.json');

                // Execute command with a single argument (Accelerate)
                let url = `http://localhost:${mockConfig.iota.server.port}//op/update`;
                try {
                    const res = await axios.post(url, mockCommandWithArgument, {
                        headers: {
                            'fiware-service': mockConfig.iota.service,
                            'fiware-servicepath': mockConfig.iota.subservice
                        }
                    });
                    expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);

                    await wait(2);
                    // Check Speed has changed
                    const mockLazyQuery = require('./mock/queryLazyAttribute.request.json');
                    url = `http://localhost:${mockConfig.iota.server.port}//op/query`;
                    try {
                        const res = await axios.post(url, mockLazyQuery, {
                            headers: {
                                'fiware-service': mockConfig.iota.service,
                                'fiware-servicepath': mockConfig.iota.subservice
                            }
                        });
                        expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                        expect(res.data[0]).to.not.equal(undefined);
                        expect(res.data[0].Speed).to.not.equal(undefined);
                        expect(res.data[0].Speed.value).to.not.equal(0);

                        const speedValue = res.data[0].Speed.value;

                        // Execute command with no arguments (Stop)
                        url = `http://localhost:${mockConfig.iota.server.port}//op/update`;
                        try {
                            const res = await axios.post(url, mockCommandNoArgument, {
                                headers: {
                                    'fiware-service': mockConfig.iota.service,
                                    'fiware-servicepath': mockConfig.iota.subservice
                                }
                            });
                            expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);

                            await wait(2);
                            // Check Speed has changed
                            const mockLazyQuery = require('./mock/queryLazyAttribute.request.json');
                            url = `http://localhost:${mockConfig.iota.server.port}//op/query`;
                            try {
                                const res = await axios.post(url, mockLazyQuery, {
                                    headers: {
                                        'fiware-service': mockConfig.iota.service,
                                        'fiware-servicepath': mockConfig.iota.subservice
                                    }
                                });
                                expect(res.status).to.greaterThanOrEqual(200).and.lessThanOrEqual(300);
                                expect(res.data[0]).to.not.equal(undefined);
                                expect(res.data[0].Speed).to.not.equal(undefined);
                                expect(res.data[0].Speed.value).to.not.equal(speedValue);
                            } catch (err) {
                                assert.fail('Request failed', 'Request success', `POST //op/query failed ${err}`);
                            }
                        } catch (err) {
                            assert.fail('Request failed', 'Request success', `POST //op/query failed ${err}`);
                        }
                    } catch (err) {
                        assert.fail('Request failed', 'Request success', `POST //op/query failed ${err}`);
                    }
                } catch (err) {
                    assert.fail('Request failed', 'Request success', `POST //op/update failed ${err}`);
                }
            });
        });
    });
});
