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
  op: 'Test',
};
var loggerTest = require('logops');
loggerTest.format = loggerTest.formatters.pipe;
var exec = require('child_process').exec;
var child;
var hostIP=null;










describe('Verify Northbound flow', function() {
  beforeEach(function(done) {
    // Set up
    done();
  });

  afterEach(function(done) {
    // Clean Up
    done();
  });

  describe('The agent is active...', function() {
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
      
        if (doAuto){
          logContext.op="Index.MappingTool";
          logger.info(logContext,'----------------    MAPPING TOOL    ----------------');
      
          var loadingBar;
          loadingBar=setInterval(function(){  process.stdout.write('.'); }, 3000);
      
          var exec = require('child_process').exec;
          try {
            if(userName!=0 && password!=0)
            {
              var cmdjava = 'java -jar ../../mapping_tool.jar  -e '+endpointUrl+' -f ./config-test.properties' + ' -u ' + userName + ' -p ' + password;
            }
            else {
              var cmdjava = 'java -jar ../../mapping_tool.jar  -e '+endpointUrl+' -f ./config-test.properties' ;
            }
            var child = exec(cmdjava, function(err, stdout, stderr) {
              clearInterval(loadingBar);
              if (err) {
                logger.error(logContext,"There is a problem with automatic configuration. Loading old configuration (if exists)...");
              }else{
                logger.info(logContext,"Automatic configuration successfully created. Loading new configuration...");
              }
             
              run.run();
              server.start();
            }
          );
        } catch (ex) {
          clearInterval(loadingBar);
          logger.info(logContext,"There is a problem with automatic configuration. Loading old configuration (if exists)...");
        }
        module.exports = child;
      }else{
        run.run();
        server.start();
      }
      
      }
      catch(ex){
        var logger = require('logops');
        logger.error(ex)
        logger.error(logContext,"Generic error: closing application...".red);
        process.exit(1);
      }
      
    } 
 // }
    );
    
    it('verify version service', function(done) {
      this.timeout(0);
      // Run test

      var value=null;
      
        

      var temperatureRequest = {
        url: 'http://'+'localhost'+':'+properties.get("api-port")+'/version',
        method: 'GET'
     };
    function myTimer() {

      var updated=false;

      request(temperatureRequest, function(error, response, body) {

        loggerTest.info(logContextTest,"RESPONSE="+JSON.stringify(response));

            if (error==null){

            loggerTest.info(logContextTest,"VERSION SERVICE SUCCESSFULLY READ".rainbow);

                done();
           
          
        }else{
            loggerTest.info(logContextTest,"VERSION SERVICE FAILURE READ".rainbow);

        }
    });

      }

      
      myTimer(); //immediate first run 

      //done();
    });



    it('verify status service', function(done) {
        this.timeout(0);
        // Run test
  
        var value=null;
        
          
  
        var temperatureRequest = {
          url: 'http://'+'localhost'+':'+properties.get("api-port")+'/status',
          method: 'GET'
       };
      function myTimer() {
  
        var updated=false;
  
        request(temperatureRequest, function(error, response, body) {
  
          loggerTest.info(logContextTest,"RESPONSE="+JSON.stringify(response));
  
              if (error==null){
  
              loggerTest.info(logContextTest,"STATUS SERVICE SUCCESSFULLY READ".rainbow);
  
                  done();
             
            
          }else{
              loggerTest.info(logContextTest,"STATUS SERVICE FAILURE READ".rainbow);
  
          }
      });
  
        }
  
        
        myTimer(); //immediate first run 
  
        //done();
      });



      it('verify commandsList service', function(done) {
        this.timeout(0);
        // Run test
  
        var value=null;
        
          
  
        var temperatureRequest = {
          url: 'http://'+'localhost'+':'+properties.get("api-port")+'/commandsList',
          method: 'GET'
       };
      function myTimer() {
  
        var updated=false;
  
        request(temperatureRequest, function(error, response, body) {
  
          loggerTest.info(logContextTest,"RESPONSE="+JSON.stringify(response));
  
              if (error==null){
  
              loggerTest.info(logContextTest,"COMMANDS LIST SERVICE SUCCESSFULLY READ".rainbow);
  
                  done();
             
            
          }else{
              loggerTest.info(logContextTest,"COMMANDS LIST SERVICE FAILURE READ".rainbow);
  
          }
      });
  
        }
  
        
        myTimer(); //immediate first run 
  
        //done();
      });



      it('verify agent lib version service ', function(done) {
        this.timeout(0);
        // Run test
  
        var value=null;
        
          
  
        var temperatureRequest = {
          url: config.providerUrl+'/version',
          method: 'GET'
       };
      function myTimer() {
  
        var updated=false;
  
        request(temperatureRequest, function(error, response, body) {
  
          loggerTest.info(logContextTest,"RESPONSE="+JSON.stringify(response));
  
              if (error==null){
  
              loggerTest.info(logContextTest,"AGENT LIB VERSION SERVICE SUCCESSFULLY READ".rainbow);
  
                  done();
             
            
          }else{
              loggerTest.info(logContextTest,"AGENT LIB VERSION SERVICE FAILURE READ".rainbow);
  
          }
      });
  
        }
  
        
        myTimer(); //immediate first run 
  
        //done();
      });


      
    
  });
});



