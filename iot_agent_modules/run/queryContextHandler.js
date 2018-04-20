module.exports = {
  //Lazy Attributes Handler
  queryContextHandler: function (id, type, service, subservice, attributes, callback, contextSubscriptions,the_session,body) {
    function createResponse(id, type, attributes, body) {

      var values = body.split(','),
      responses = [];

      for (var i = 0; i < attributes.length; i++) {
        responses.push({
          name: attributes[i],
          type: "string",
          value: values[i]
        });
      }

      return {
        id: id,
        type: type,
        attributes: responses
      };
    }

    contextSubscriptions.forEach(function (contextSubscription) {
      if (contextSubscription.id===id){
        contextSubscription.mappings.forEach(function (mapping) {

          attributes.forEach(function (attribute) {
            if (attribute===mapping.ocb_id){
              the_session.readVariableValue(mapping.opcua_id, function(err,dataValue) {
                if (!err) {
                  console.log(" read variable % = " , dataValue.toString());
                }
                callback(err, createResponse(id, type, attributes, ""+dataValue.value.value));

              });
            }
          });
        });
      }
    });
  }
}
