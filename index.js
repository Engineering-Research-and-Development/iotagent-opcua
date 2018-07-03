global.logContext = {
  comp: 'iotAgent-OPCUA',
  op: 'Index',
  srv: '',
  subsrv: ''
};

try{

  // node-opcue dependencies
  require("requirish")._(module);
  var check_prop = require("./iot_agent_modules/check_properties");
  if(check_prop.checkproperties().length != 0){
    console.log("WARNING!!!")
    console.log("CHECK YOUR config.properties FILE,  THE FOLLOWING PARAMETERS ARE NULL:")
    for (var null_params in check_prop.checkproperties())
      console.log(check_prop.checkproperties()[null_params]);
      process.exit(1);
  }

  var server = require('./iot_agent_modules/services/server');
  var run = require('./iot_agent_modules/run/run');
  var fs = require('fs');
  // custom simple logger
  var logger = require('logops');
  logger.format = logger.formatters.pipe;

  var PropertiesReader = require('properties-reader');
  var properties = PropertiesReader('./conf/config.properties');
  var endpointUrl = properties.get('endpoint');
  var userName = properties.get('userName');
  var password = properties.get('password');

  if (endpointUrl==null){
    logger.info(logContext,"/conf/config.properties: endpoint not found...".red);
    process.exit(1);
  }

  var doAuto = false;

  if (fs.existsSync('./conf/config.json')) {
    var config = require('./conf/config.json');
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
        var cmdjava = 'java -jar mapping_tool.jar  -e '+endpointUrl+' -f conf/config.properties' + ' -u ' + userName + ' -p ' + password;
      }
      else {
        var cmdjava = 'java -jar mapping_tool.jar  -e '+endpointUrl+' -f conf/config.properties' ;
      }
      var child = exec(cmdjava, function(err, stdout, stderr) {
        clearInterval(loadingBar);
        if (err) {
          logger.error(logContext,"\nThere is a problem with automatic configuration. Loading old configuration (if exists)...".red);

        }else{
          logger.info(logContext,"\nAutomatic configuration successfully created. Loading new configuration...".cyan);
        }
        run.run();
        server.start();
      }
    );
  } catch (ex) {
    clearInterval(loadingBar);
    logger.info(logContext,"\nThere is a problem with automatic configuration. Loading old configuration (if exists)...".red);
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
