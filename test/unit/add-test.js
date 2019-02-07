/*
 * Copyright 2019 -  Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opc-ua
 *
 */

const request = require('request');

var colors = require('colors');
// Set Up
global.logContextTest = {
    comp: 'iotAgent-OPCUA',
    op: 'Test'
};
var loggerTest = require('logops');
loggerTest.format = loggerTest.formatters.pipe;
var exec = require('child_process').exec;
var child;

var hostIP=null;


child = exec("sudo docker exec opc_ua_test_orion  ip route | grep default | cut -f 3 -d ' '",
   function (error, stdout, stderr) {
    

      if (error !== null) {
        loggerTest.info(logContextTest,"exec error: ".rainbow, error);

      }
   else{

       hostIP=stdout.replace(/(\r\n|\n|\r)/gm, "");

       if (hostIP!=null){
        var port=config.providerUrl.split(":")[2];
        config.providerUrl=hostIP+":"+port;
      }
   }
});







describe('Verify Northbound flow', function() {
  beforeEach(function(done) {
    // Set up
    done();
  });

  afterEach(function(done) {
    // Clean Up
    done();
  });

  describe('The agent is monitoring active attributes...', function() {
    before(//async () => {
     // await 

     function() {

      

      // Set Up
      global.logContext = {
        comp: 'iotAgent-OPCUA',
        op: 'Index',
        srv: '',
        subsrv: ''
      };
       
      
      try{
      
        // node-opcue dependencies
        require("requirish")._(module);
        var check_prop = require("../../iot_agent_modules/check_properties");
        if(check_prop.checkproperties().length != 0){
          console.log("WARNING!!!")
          console.log("CHECK YOUR config.properties FILE,  THE FOLLOWING PARAMETERS ARE NULL:")
          for (var null_params in check_prop.checkproperties())
            console.log(check_prop.checkproperties()[null_params]);
            process.exit(1);
        }
      
        var server = require('../../iot_agent_modules/services/server');
        var run = require('../../iot_agent_modules/run/run');
        var fs = require('fs');
        // custom simple logger
       
      
        var PropertiesReader = require('properties-reader');
     

        loggerTest.info(logContextTest,"INITIALIZING TESTING ENVIRONMENT...".rainbow);

        var iotAgentConfig = require('./config-test.json');
        //var iotAgentProp = require('./config.properties');
      
        var properties = PropertiesReader(require('path').resolve(__dirname, './config-test.properties'));
        global.properties = properties;
        var endpointUrl = properties.get('endpoint');
        var userName = properties.get('userName');
        var password = properties.get('password');
      
        if (endpointUrl==null){
          logger.info(logContext,"/AGE/config-test.properties: endpoint not found...".red);
          process.exit(1);
        }
      
        var doAuto = false;
        var configPath=require('path').resolve(__dirname, './config-test.json');
        if (fs.existsSync(configPath)) {
          var config = require(configPath);

          if (hostIP!=null){
            var port=config.providerUrl.split(':')[2];
            config.providerUrl=hostIP+":"+port;
          }
          global.config = config;
        }
        else{
          doAuto = true;

        }
    }
});

describe('Verify Northbound flow', function() {
    beforeEach(function(done) {
        // Set up
        done();
    });



    it('verify commands execution as context provider', function(done) {
      this.timeout(0);
      console.log("verify commands execution as context provider");
      // Run test
      
     
      //STOP CAR
      var json={};
      json.value=null;
      json.type="command";
      var stopRequest = {
        url: 'http://'+config.contextBroker.host+':'+config.contextBroker.port+'/v2/entities/Car/attrs/Stop?type=Car',
        method: 'PUT',
        json: json,
        headers: {
            'fiware-service': config.service,
            'fiware-servicepath': config.subservice
        }
    };
    request(stopRequest, function(error, response, body) {
      console.log("stopRequest error STOP="+JSON.stringify(error));
      console.log("stopRequest response STOP="+JSON.stringify(response));
      console.log("stopRequest body STOP="+JSON.stringify(body));

    });
     
     
     
      //STOP CAR locally (for Travis unreachability)
      var json={
        "contextElements": [
            {
               "type": "Car",
                "isPattern": "false",
                "id": "Car",
                "attributes": [
                  {
                    "name":"Stop",
                    "type":"command",
                    "value":null
                  }
                ]
            }
        ],
        "updateAction": "UPDATE"
    };

      var stopRequest = {
        url: 'http://localhost:4001/v1/updateContext',
        method: 'POST',
        json: json,
        headers: {
            'fiware-service': config.service,
            'fiware-servicepath': config.subservice
        }
    };
    request(stopRequest, function(error, response, body) {
      console.log("stopRequest locally error ="+JSON.stringify(error));
      console.log("stopRequest locally response ="+JSON.stringify(response));
      console.log("stopRequest locally body ="+JSON.stringify(body));

    });
     
      


     
     
     
     
      

     
     
     

     
      //Accelerate CAR locally (for Travis unreachability)
      var json={
        "contextElements": [
            {
               "type": "Car",
                "isPattern": "false",
                "id": "Car",
                "attributes": [
                  {
                    "name":"Accelerate",
                    "type":"command",
                    "value":[2]
                  }
                ]
            }
        ],
        "updateAction": "UPDATE"
    }
;
     
      var accelerateRequest = {
        url: 'http://localhost:4001/v1/updateContext',
        method: 'POST',
        json: json,
        headers: {
            'fiware-service': config.service,
            'fiware-servicepath': config.subservice
        }
    };
    request(accelerateRequest, function(error, response, body) {
      console.log("accelerateRequest locally error ="+JSON.stringify(error));
      console.log("accelerateRequest locally response ="+JSON.stringify(response));
      console.log("accelerateRequest locally body ="+JSON.stringify(body));

    });
     
     
     
     
     

 

    var myVar = setTimeout(accelerateFunction, 2000);

      var myVar = setInterval(myTimer, 10000);
      var value=null;
     
      function accelerateFunction() {

      
     var json={};
     json.value=[2];
     json.type="command";
        

      var accelerateRequest = {
        url: 'http://'+config.contextBroker.host+':'+config.contextBroker.port+'/v2/entities/Car/attrs/Accelerate?type=Car',
        method: 'PUT',
        json: json,
        headers: {
            'fiware-service': config.service,
            'fiware-servicepath': config.subservice
        }
    };
    request(accelerateRequest, function(error, response, body) {
     console.log("accelerateRequest error ="+JSON.stringify(error));
console.log("accelerateRequest response ="+JSON.stringify(response));
console.log("accelerateRequest body ="+JSON.stringify(body));
  });
       
       
       
          //Accelerate CAR locally (for Travis unreachability)
      var json={
        "contextElements": [
            {
               "type": "Car",
                "isPattern": "false",
                "id": "Car",
                "attributes": [
                  {
                    "name":"Accelerate",
                    "type":"command",
                    "value":[2]
                  }
                ]
            }
        ],
        "updateAction": "UPDATE"
    }
;
     
      var accelerateRequest = {
        url: 'http://localhost:4001/v1/updateContext',
        method: 'POST',
        json: json,
        headers: {
            'fiware-service': config.service,
            'fiware-servicepath': config.subservice
        }
    };
    request(accelerateRequest, function(error, response, body) {
      console.log("accelerateRequest locally error ="+JSON.stringify(error));
      console.log("accelerateRequest locally response ="+JSON.stringify(response));
      console.log("accelerateRequest locally body ="+JSON.stringify(body));

    });
       
       
}
    function myTimer() {
      var updated=false;
      var speedRequest = {
        url: 'http://'+config.contextBroker.host+':'+config.contextBroker.port+'/v2/entities/Car/attrs/Speed',
        method: 'GET',
        headers: {
            'fiware-service': config.service,
            'fiware-servicepath': config.subservice
        }
    };
      request(speedRequest, function(error, response, body) {

        var bodyObject={};
        bodyObject=JSON.parse(body);
        if (value!=null){
          if (value!=bodyObject.value){
            value=bodyObject.value;
            var text='value updated '+value;
            loggerTest.info(logContextTest,text.rainbow);
            updated=true;
            clearInterval(myVar);
            done();

          }
        }else{
          value=bodyObject.value;
        }
        if (!updated){
          var text='value '+value;
          loggerTest.info(logContextTest,text.rainbow);
        }
    });
      }
    });
});
