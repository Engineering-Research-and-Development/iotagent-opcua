var async = require("async");
var ngsi = require('./../../lib/services/ngsi/ngsiService');

module.exports = {
  commandContextHandler: function (id, type, service, subservice, attributes, callback,contextSubscriptions,the_session,contexts,iotAgentLib,device,status,value,constants) {
console.log("PIPPO MIO commandContextHandler");

    function executeUpdateValues(device, id, type, service, subservice, attributes, status, value, callback,constants) {

      var sideEffects = [];
      if (device.commands) {
        for (var i = 0; i < device.commands.length; i++) {
          for (var j = 0; j < attributes.length; j++) {
            if (device.commands[i].name === attributes[j].name) {
              var newAttributes = [
                {
                  name: device.commands[i].name + '_status',
                  type: constants.COMMAND_STATUS,
                  value: status
                },
                {
                  name: device.commands[i].name + '_info',
                  type: constants.COMMAND_RESULT,
                  value: value
                }
              ];

              sideEffects.push(
                async.apply(ngsi.update,
                  device.id,
                  device.resource,
                  device.apikey,
                  newAttributes,
                  device
                )
              );
            }
          }
        }
      }

      async.series(sideEffects,  function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
          var length = Math.max(arguments.length - startIndex, 0);
          var rest = Array(length);
          for (var index = 0; index < length; index++) {
            rest[index] = arguments[index + startIndex];
          }
          switch (startIndex) {
            case 0: return func.call(this, rest);
            case 1: return func.call(this, arguments[0], rest);
          }
        };
      });
    }

console.log("PIPPO MIO prima di contextSubscriptions");
    contextSubscriptions.forEach(function (contextSubscription) {
console.log("PIPPO MIO contextSubscriptions");
      if (contextSubscription.id===id){

        contextSubscription.mappings.forEach(function (mapping) {
        console.log("PIPPO MIO A");
				console.log("PIPPO MIO A"+JSON.stringify(attributes));
          attributes.forEach(function (attribute) {
            if (attribute.name===mapping.ocb_id){

              var input=mapping.inputArguments;
              if (input!=null){

                var i=0;
                input.forEach(function (inputType) {
                  inputType["value"]=attribute.value[i++];
                });
              }
              var methodsToCall = [];
              methodsToCall.push({
                objectId: ""+mapping.object_id,
                methodId: ""+mapping.opcua_id,

                inputArguments: input
              });
              console.log("method to call ="+JSON.stringify(methodsToCall));
              the_session.call(methodsToCall,function(err,results){

                callback(err, {
                  id: id,
                  type: type,
                  attributes: attributes
                });

				console.log("PIPPO MIO");
				console.log("PIPPO MIO "+JSON.stringify(contexts));
                contexts.forEach(function (context) {
                  iotAgentLib.getDevice(context.id, context.service, context.subservice, function (err, device) {
                    if (err) {
                      console.log("could not find the OCB context " + context.id + "".red.bold);
                      console.log(JSON.stringify(err).red.bold);
                      executeUpdateValues(device, id, type, service, subservice, attributes, "ERROR", "generic error", callback);

                    } else {

                      if (results[0].statusCode.name===opcua.StatusCodes.Bad.name)
                      executeUpdateValues(device, id, type, service, subservice, attributes, "ERROR", results[0].outputArguments[0].value, callback);
                      else{
                        if (results[0].outputArguments[0]!==undefined)
                        executeUpdateValues(device, id, type, service, subservice, attributes, "OK", results[0].outputArguments[0].value, callback);
                      }
                    }
                  });
                });
              });
            }
          });
        });
      }
    });
  }
}
