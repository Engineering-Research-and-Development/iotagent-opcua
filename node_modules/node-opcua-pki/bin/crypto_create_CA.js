#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// node-opcua
// ---------------------------------------------------------------------------------------------------------------------
// Copyright (c) 2014-2015 - Etienne Rossignon - etienne.rossignon (at) gadz.org
// ---------------------------------------------------------------------------------------------------------------------
//
// This  project is licensed under the terms of the MIT license.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so,  subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
// Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// ---------------------------------------------------------------------------------------------------------------------

"use strict";
//Error.stackTraceLimit = Infinity;

var path = require("path");
var fs = require("fs");
var colors = require("colors");
var del = require("del");

var async = require("async");
var _ = require("underscore");
var assert = require("better-assert");

var get_fully_qualified_domain_name = require("../lib/misc/hostname").get_fully_qualified_domain_name;
var hostname = require("os").hostname();
var makeApplicationUrn = require("../lib/misc/applicationurn").makeApplicationUrn;


var pki = require("../index");
var toolbox = require("../index").toolbox;
var mkdir = toolbox.mkdir;
var displayChapter = toolbox.displayChapter;
var displayTitle = toolbox.displayTitle;
var displaySubtitle = toolbox.displaySubtitle;
var getPublicKeyFromPrivateKey = toolbox.getPublicKeyFromPrivateKey;
var make_path = toolbox.make_path;

var Subject = require("../lib/misc/subject").Subject;

// ------------------------------------------------- some useful dates
function get_offset_date(date, nb_days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + nb_days);
    return d;
}

var today = new Date();
var yesterday = get_offset_date(today, -1);
var two_years_ago = get_offset_date(today, -2 * 365);
var next_year = get_offset_date(today, 365);

var g_config;

var g_certificateAuthority; // the Certificate Authority

/***
 *
 * @method construct_CertificateAuthority
 * @param callback {Function}
 *
 * prerequisites :
 *   g_config.CAFolder : the folder of the CA
 */
function construct_CertificateAuthority(callback) {

    assert(_.isFunction(callback));
    assert(_.isString(g_config.CAFolder)); // verify that g_config file has been loaded

    if (!g_certificateAuthority) {
        g_certificateAuthority = new pki.CertificateAuthority({location: g_config.CAFolder});
        g_certificateAuthority.initialize(callback);
    } else {
        return callback();
    }
}

var certificateManager; // the Certificate Manager
/***
 *
 * @method construct_CertificateManager
 * @param callback {Function}
 *
 * prerequisites :
 *   g_config.PKIFolder : the folder of the PKI
 */
function construct_CertificateManager(callback) {

    assert(_.isFunction(callback));
    assert(_.isString(g_config.PKIFolder));

    if (!certificateManager) {
        certificateManager = new pki.CertificateManager({location: g_config.PKIFolder});
        certificateManager.initialize(callback);
    } else {
        return callback();
    }
}

function displayConfig(config) {
    function w(str, l) {
        return (str + "                            ").substr(0, l);
    }
    console.log(" configuration = ".yellow);
    _.forEach(config, function (value, key) {
        console.log("   " + w(key, 30).yellow + " : " + value.toString().cyan);
    });
}

function readConfiguration(argv, callback) {

    assert(_.isFunction(callback));

    if (argv.silent) {
        toolbox.g_config.silent = true;
    }
    var hostname = get_fully_qualified_domain_name();

    var certificateDir;

    function performSubstitution(str) {
        str = str.replace("{CWD}",process.cwd());
        if(certificateDir) {
            str = str.replace("{root}",certificateDir);
        }
        if(g_config && g_config.PKIFolder) {
            str = str.replace("{PKIFolder}",g_config.PKIFolder);
        }
        str = str.replace("{hostname}",hostname);
        return str;
    }

    function prepare(file) {
        var tmp = path.resolve(performSubstitution(file));
        return toolbox.make_path(tmp);
    }

    // ---------------------------------------------------------------------------------------------------------------------
    certificateDir = argv.root;
    assert(typeof certificateDir === "string");

    certificateDir = prepare(certificateDir);
    mkdir(certificateDir);
    assert(fs.existsSync(certificateDir));

    // ---------------------------------------------------------------------------------------------------------------------
    //xx var default_config = path.join(certificateDir, path.basename(__filename, ".js") + "_config.js");
    var default_config = path.join(certificateDir, "config.js");

    var default_config_template = path.join(__dirname, path.basename(__filename, ".js") + "_config.example.js");
    if (!fs.existsSync(default_config) && fs.existsSync(default_config_template)) {
        // copy
        console.log(" Creating default g_config file ".yellow, default_config.cyan);
        fs.writeFileSync(default_config, fs.readFileSync(default_config_template));
    } else {
        console.log(" using  g_config file ".yellow, default_config.cyan);
    }

    // see http://stackoverflow.com/questions/94445/using-openssl-what-does-unable-to-write-random-state-mean
    // set random file to be random.rnd in the same folder as the g_config file
    process.env["RANDFILE"] = path.join(path.dirname(default_config),"random.rnd");

    /* eslint global-require: 0*/
    g_config = require(default_config);

    g_config.subject = new Subject(g_config.subject);

    g_config.certificateDir = certificateDir;

    // ---------------------------------------------------------------------------------------------------------------------
    var CAFolder= argv.CAFolder || path.join(certificateDir,"CA");
    CAFolder=  prepare(CAFolder);
    g_config.CAFolder = CAFolder;

    // ---------------------------------------------------------------------------------------------------------------------
    g_config.PKIFolder = path.join(g_config.certificateDir,"PKI");
    if (argv.PKIFolder) {
        g_config.PKIFolder = prepare(argv.PKIFolder);
    }
    g_config.PKIFolder=  prepare(g_config.PKIFolder);


    if (argv.privateKey) {
        g_config.privateKey = prepare(argv.privateKey);
    }

    if (argv.applicationUri) {
        g_config.applicationUri = performSubstitution(argv.applicationUri);
    }

    if (argv.output) {
        g_config.outputFile = argv.output;
    }

    g_config.altNames = [];
    if (argv.altNames){
        g_config.altNames = argv.altNames.split(";");
    }
    g_config.dns = [
        get_fully_qualified_domain_name()
    ];
    if (argv.dns) {
        g_config.dns = argv.dns.split(",");
    }
    g_config.ip = [];
    if (argv.ip) {
        g_config.ip = argv.ip.split(",");
    }
    if (argv.keySize) {
        g_config.keySize = argv.keySize
    }

    if (argv.validity) {
        g_config.validity = argv.validity
    }
    displayConfig(g_config);
    // ---------------------------------------------------------------------------------------------------------------------

    return callback();
}

function add_standard_option(options,optionName) {

    switch(optionName) {

        case "root":
            options.root =  {
                alias: "r",
                type: "string",
                default: "{CWD}/certificates",
                describe: "the location of the Certificate folder"
            };
            break;

        case "CAFolder":
            options.CAFolder =  {
                alias: "c",
                type: "string",
                default: "{root}/CA",
                describe: "the location of the Certificate Authority folder"
            };
            break;

        case "PKIFolder":
            options.PKIFolder =  {
                alias: "p",
                type: "string",
                default: "{root}/PKI",
                describe: "the location of the Public Key Infrastructure"
            };
            break;

        case "silent":
            options.silent = {
                alias: "s",
                type: "boolean",
                describe: "minimize output"
            };
            break;

        case "privateKey":
            options.privateKey= {
                alias: "p",
                type: "string",
                default: "{PKIFolder}/own/private_key.pem",
                describe: "the private key to use to generate certificate"
            };
            break;
        default:
            throw Error("Unknown option  " + optionName);
        }
}

function on_completion(err) {
    if (err) {
        console.log(err.message);
    }
}
function createDefaultCertificate(base_name, prefix, key_length, applicationUri, dev, done) {

    assert(key_length === 1024 || key_length === 2048 );

    assert(_.isFunction(done));

    var private_key_file                = make_path(base_name, prefix + "key_"             + key_length + ".pem");
    var public_key_file                 = make_path(base_name, prefix + "public_key_"      + key_length + ".pub");
    var certificate_file                = make_path(base_name, prefix + "cert_"            + key_length + ".pem");
    var certificate_file_outofdate      = make_path(base_name, prefix + "cert_"            + key_length + "_outofdate.pem");
    var certificate_file_not_active_yet = make_path(base_name, prefix + "cert_"            + key_length + "_not_active_yet.pem");
    var certificate_revoked             = make_path(base_name, prefix + "cert_"            + key_length + "_revoked.pem");
    var self_signed_certificate_file    = make_path(base_name, prefix + "selfsigned_cert_" + key_length + ".pem");

    console.log(" urn = ", applicationUri);

    var dns = [
        "localhost",
        get_fully_qualified_domain_name()
    ];
    var ip = [];

    function createCertificate(certificate, private_key, applicationUri, startDate, validity, callback) {

        var crs_file = certificate + ".csr";

        var configFile = make_path(base_name,"../certificates/PKI/own/openssl.cnf");

        var params = {
            privateKey: private_key,
            rootDir: ".",
            configFile: configFile
        };

        // create CSR
        toolbox.createCertificateSigningRequest(crs_file, params, function (err) {

            if (err) {
                return callback(err);
            }
            g_certificateAuthority.signCertificateRequest(certificate, crs_file, {
                applicationUri: applicationUri,
                dns: dns,
                ip: ip,
                startDate: startDate,
                validity: validity
            }, callback);

        });
    }

    function createSelfSignedCertificate(certificate, private_key, applicationUri, startDate, validity, callback) {

        g_certificateAuthority.createSelfSignedCertificate(certificate, private_key, {
            applicationUri: applicationUri,
            dns: dns,
            ip: ip,
            startDate: startDate,
            validity: validity
        }, callback);
    }

    function revoke_certificate(certificate, callback) {
        g_certificateAuthority.revokeCertificate(certificate, {}, callback);
    }
    function createPrivateKey(privateKey,keyLength,callback) {

        fs.exists(privateKey,function (exists){
            if (exists) {
                console.log("         privateKey".yellow, privateKey.cyan," already exists => skipping".yellow);
                return callback();
            }else {
                toolbox.createPrivateKey(privateKey,keyLength,callback);
            }
        });

    }
    var tasks1 = [

        displaySubtitle.bind(null," create private key :" + private_key_file),
        createPrivateKey.bind(null, private_key_file, key_length),

        displaySubtitle.bind(null," extract public key " + public_key_file + " from private key "),
        getPublicKeyFromPrivateKey.bind(null, private_key_file, public_key_file),

        displaySubtitle.bind(null," create Certificate " + certificate_file ),
        createCertificate.bind(null, certificate_file, private_key_file, applicationUri, yesterday, 365),

        displaySubtitle.bind(null," create self signed Certificate " +self_signed_certificate_file ),
        createSelfSignedCertificate.bind(null, self_signed_certificate_file, private_key_file, applicationUri, yesterday, 365)

    ];

    if (dev) {
        var tasks2 = [
            createCertificate.bind(null,  certificate_file_outofdate,      private_key_file, applicationUri, two_years_ago, 365),
            createCertificate.bind(null,  certificate_file_not_active_yet, private_key_file, applicationUri, next_year, 365),
            createCertificate.bind(null,  certificate_revoked,             private_key_file, applicationUri, yesterday, 365),
            revoke_certificate.bind(null, certificate_revoked)
        ];
        tasks1 = tasks1.concat(tasks2);
    }

    async.series(tasks1, done);

}

var g_argv = require('yargs')
    .strict()
    .wrap(132)
    .command("demo", "create default certificate for node-opcua demos", function (yargs, argv) {


        function command_demo(local_argv) {

            function createDefaultCertificates(callback) {
                function create_default_certificates(done) {
                    function __create_default_certificates(base_name, prefix, key_length, applicationUri, done) {
                        createDefaultCertificate(base_name,prefix,key_length,applicationUri,local_argv.dev,done);
                    }

                    assert(g_certificateAuthority instanceof pki.CertificateAuthority);

                    assert(g_config);
                    var base_name = g_config.certificateDir;
                    assert(fs.existsSync(base_name));

                    var hostname = get_fully_qualified_domain_name();
                    console.log("     hostname = ".yellow, hostname.cyan);

                    var clientURN          = makeApplicationUrn(hostname, "NodeOPCUA-Client");
                    var serverURN          = makeApplicationUrn(hostname, "NodeOPCUA-Server");
                    var discoveryServerURN = makeApplicationUrn(hostname, "NodeOPCUA-DiscoveryServer");

                    var task1 = [

                        displayTitle.bind(null, "Create  Application Certificate for Server & its private key"),
                        __create_default_certificates.bind(null, base_name, "client_", 1024, clientURN),
                        __create_default_certificates.bind(null, base_name, "client_", 2048, clientURN),

                        displayTitle.bind(null, "Create  Application Certificate for Client & its private key"),
                        __create_default_certificates.bind(null, base_name, "server_", 1024, serverURN),
                        __create_default_certificates.bind(null, base_name, "server_", 2048, serverURN),

                        displayTitle.bind(null, "Create  Application Certificate for DiscoveryServer & its private key"),
                        __create_default_certificates.bind(null, base_name, "discoveryServer_", 1024, discoveryServerURN),
                        __create_default_certificates.bind(null, base_name, "discoveryServer_", 2048, discoveryServerURN)

                    ];
                    async.series(task1, done);
                }

                async.series([
                    construct_CertificateAuthority.bind(null),
                    construct_CertificateManager.bind(null),
                    create_default_certificates.bind(null)
                ], function (err) {
                    if (err) {
                        console.log("ERROR ".red, err.message);
                    }
                    return callback(err);
                });
            }
            var tasks = [];
            tasks.push(displayChapter.bind(null, "Create Demo certificates"));
            tasks.push(displayTitle.bind(null, "reading configuration"));
            tasks.push(readConfiguration.bind(null, local_argv));

            if (local_argv.clean) {

                tasks.push(displayTitle.bind(null, "Cleaning old certificates"));
                tasks.push(function (callback) {
                    assert(g_config);
                    var certificateDir = g_config.certificateDir;
                    del(certificateDir+"/*.pem*").then(function() {
                        return callback()
                    });
                });
                tasks.push(function (callback) {
                    assert(g_config);
                    var certificateDir = g_config.certificateDir;
                    del(certificateDir+"/*.pub").then(function() {
                        return callback();
                    });
                });
                tasks.push(function (callback) {
                    assert(g_config);
                    var certificateDir = g_config.certificateDir;
                    mkdir(certificateDir);
                    console.log("   done");
                    return callback();
                });
            }

            tasks.push(displayTitle.bind(null, "create certificates"));
            tasks.push(createDefaultCertificates);

            async.series(tasks, on_completion);
        }

        var options  ={};
        options.dev = {
            type: "boolean",
            describe: "create all sort of fancy certificates for dev testing purposes"
        };
        options.clean = {
            type: "boolean",
            describe: "Purge existing directory [use with care!]"
        };

        add_standard_option(options,"silent");
        add_standard_option(options,"root");

        var local_argv = yargs
            .strict().wrap(132)
            .options(options)
            .usage("$0  demo [--dev] [--silent] [--clean]")
            .example("$0  demo --dev")
            .help("help")
            .argv;

        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            command_demo(local_argv);
        }
    })

    .command("createCA" ,"create a Certificate Authority",function(yargs,argv){

        function command_new_certificate_authority(local_argv) {

            var tasks = [];
            tasks.push(readConfiguration.bind(null, local_argv));
            tasks.push(construct_CertificateAuthority.bind(null));
            async.series(tasks,on_completion);
        }

        var options ={};

        add_standard_option(options,"root");
        add_standard_option(options,"CAFolder");

        var local_argv = yargs.strict().wrap(132)
            .options(options)
            .help("help")
            .argv;

        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            command_new_certificate_authority(local_argv);
        }
    })

    .command("createPKI" ,"create a Public Key Infrastructure",function(yargs,argv) {

        function command_new_public_key_infrastructure(local_argv) {
            var tasks = [];
            tasks.push(readConfiguration.bind(null, local_argv));
            tasks.push(construct_CertificateManager.bind(null));
            async.series(tasks, on_completion);
        }

        var options ={};

        add_standard_option(options,"root");
        add_standard_option(options,"PKIFolder");

        var local_argv = yargs.strict().wrap(132)
            .options(options)
            .help("help")
            .argv;

        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            command_new_public_key_infrastructure(local_argv);
        }
    })

    // ----------------------------------------------- certificate
    .command("certificate", "create a new certificate", function (yargs, argv) {

        function command_certificate(local_argv) {

            var selfSigned = local_argv.selfSigned;

            if (!selfSigned) {
                command_full_certificate(local_argv);
            } else {
                command_selfsigned_certificate(local_argv);
            }
        }

        function command_selfsigned_certificate(local_argv) {

            var tasks = [];

            tasks.push(readConfiguration.bind(null, local_argv));

            tasks.push(construct_CertificateManager.bind(null));

            tasks.push(function(callback) {

                g_config.outputFile = g_config.outputFile || "self_signed_certificate.pem";
                displaySubtitle(" create self signed Certificate " +g_config.outputFile );
                // console.log(" output file =  ",g_config.output);

                certificateManager.createSelfSignedCertificate(g_config,function(err){
                    callback(err);
                });
            });

            async.series(tasks, on_completion);

        }
        function command_full_certificate(local_argv) {
            var the_csr_file;
            var certificate;
            var tasks = [];


            tasks.push(readConfiguration.bind(null, local_argv));

            tasks.push(construct_CertificateManager.bind(null));

            tasks.push(construct_CertificateAuthority.bind(null));

            tasks.push(function(callback) {
                assert(fs.existsSync(g_config.CAFolder)," CA folder must exist");
                return callback();
            });


            tasks.push(function(callback){

                g_config.privateKey = null; // use PKI private key
                // create a Certificate Request from the certificate Manager
                certificateManager.createCertificateRequest(g_config,function(err,csr_file){
                    if(err) { return callback(err); }

                    the_csr_file = csr_file;
                    console.log(" csr_file = ",csr_file);
                    return callback();
                });
            });
            tasks.push(function(callback) {

                certificate = the_csr_file.replace(".csr",".pem");

                if (fs.existsSync(certificate)) {
                    throw new Error(" File " +certificate + " already exist");
                }

                g_certificateAuthority.signCertificateRequest(certificate,the_csr_file,g_config,function(err){
                    return callback(err);
                });
            });

            tasks.push(function(callback){

                console.error("g_config.outputFile=",g_config.outputFile);

                assert(_.isString(g_config.outputFile));
                fs.writeFileSync(g_config.outputFile,fs.readFileSync(certificate,"ascii"));
                return callback();
            });

            async.series(tasks, on_completion);

        }


        var options = {
            "applicationUri": {
                alias: "a",
                demand: true,
                describe: "the application URI",
                default:"urn:{hostname}:Node-OPCUA-Server",
                type: "string"
            },
            "output": {
                default: "my_certificate.pem",
                alias: "o",
                demand: true,
                describe: "the name of the generated certificate =>",
                type: "string"
            },
            "selfSigned": {
                alias: "s",
                default: false,
                type: "boolean",
                describe: "if true, certificate will be self-signed"
            },
            "validity": {
                alias: "v",
                default: null,
                type: "number",
                describe: "the certificate validity in days"
            },
            "dns": {
                alias: "dns",
                default: null,
                type: "string",
                describe: "the list of valid domain name"
            },
            "ip": {
                alias: "ip",
                default: null,
                type: "string",
                describe: "the list of valid IP"
            }
        };
        add_standard_option(options,"silent");
        add_standard_option(options,"root");
        add_standard_option(options,"CAFolder");
        add_standard_option(options,"PKIFolder");
        add_standard_option(options,"privateKey");

        var local_argv = yargs.strict().wrap(132)
            .options(options)
            .help("help")
            .argv;

        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            command_certificate(local_argv);
        }
    })

    // ----------------------------------------------- revoke
    .command("revoke", "revoke a existing certificate", function (yargs, argv) {

        function revokeCertificateFromCommandLine(argv) {

            function revoke_certificate(certificate, callback) {
                g_certificateAuthority.revokeCertificate(certificate, {}, callback);
            }

            // example : node bin\crypto_create_CA.js revoke my_certificate.pem
            var certificate = path.resolve(argv._[1]);
            console.log(" Certificate to revoke : ".yellow, certificate.cyan);

            if (!fs.existsSync(certificate)) {
                throw new Error("cannot find certificate to revoke " +certificate);

            }
            var tasks =[];

            tasks.push(readConfiguration.bind(null, local_argv));
            tasks.push(construct_CertificateAuthority.bind(null));
            tasks.push(revoke_certificate.bind(null, certificate));

            async.series(tasks, function (err) {
                if (!err) {
                    console.log("done ... ", err);
                    console.log("\nyou should now publish the new Certificate Revocation List");
                } else{
                    console.log("done ... ", err.message);
                }

            });
        }

        var options = {};
        add_standard_option(options,"root");
        add_standard_option(options,"CAFolder");

        var local_argv = yargs.strict().wrap(132)
            .help("help")
            .usage("$0 revoke  my_certificate.pem")
            .options(options)
            .demand(2)
            .argv;


        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            revokeCertificateFromCommandLine(local_argv);
        }

    })

    .command("dump","display a certificate",function(yargs,argv){

        function dumpCertificateFromCommandLine(argv){
            var certificate = path.resolve(argv._[1]);
            toolbox.dumpCertificate(certificate,function() {

            });
        }
        var options = {};

        var local_argv = yargs.strict().wrap(132)
            .help("help")
            .usage("$0 dump  my_certificate.pem")
            .options(options)
            .demand(1)
            .argv;
        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            dumpCertificateFromCommandLine(local_argv);
        }
    })
    .command("toder","convert a certificate to a DER format with finger print",function(yargs,argv){

        toolbox.g_config.silent = true;

        function convertToDerFromCommandLine(argv){
            var certificate = path.resolve(argv._[1]);
            toolbox.toDer(certificate,function() {

            });
        }
        var options = {};

        var local_argv = yargs.strict().wrap(132)
            .help("help")
            .usage("$0 toder  my_certificate.pem")
            .options(options)
            .demand(1)
            .argv;
        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            convertToDerFromCommandLine(local_argv);
        }
    })
    .command("fingerprint","print the certifcate fingerprint",function(yargs,argv){

        toolbox.g_config.silent = true;

        function fingerprint(argv){
            var certificate = path.resolve(argv._[1]);
            toolbox.fingerprint(certificate,function(err,data) {
                if (!err){
                    var s = data.split("=")[1].split(":").join("").trim();
                    console.log(s);
                }

            });
        }
        var options = {};
        add_standard_option(options,"silent");

        var local_argv = yargs.strict().wrap(132)
            .help("help")
            .usage("$0 toder  my_certificate.pem")
            .options(options)
            .demand(1)
            .argv;

        if (local_argv.help) {
            console.log(yargs.help());
        } else {
            fingerprint(local_argv);
        }
    })    .help("help")
    .strict()
    .argv;

if (g_argv._.length<1) {
    console.log( " use --help for more info")
}
