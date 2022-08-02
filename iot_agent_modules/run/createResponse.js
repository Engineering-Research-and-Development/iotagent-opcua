module.exports = {
    createResponse: function(id, type, attributes, body, metadata) {
        var values = body.split(',');
        //var responses = [];

        var returnObj = {
            id: id,
            type: type
        };

        for (var i = 0; i < attributes.length; i++) {
            var obj = {};
            /* responses.push({
                name: attributes[i],
                type: 'string',
                value: values[i],
                metadatas: metadata[i]
            });*/
            obj[attributes[i]] = {
                type: 'string',
                value: values[i]
            };
            Object.assign(returnObj, obj);
        }
        console.log(returnObj);

        return returnObj;
    }
};
