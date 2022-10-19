module.exports = {

    smartDataModelCrawler: async function (configJS, smartDataModel, configJson) {
        const fs = require('fs');
        var path = require('path');

        var obj = {};
        var context = {};
        var contexts = [];
        var contextSubscriptions = {};
        var contextSubscriptionsMapping = [];
        var active = [];
        var lazy = [];
        var commands = [];
        var listOfAttributes = [];

        function traverseCompanionTemplate(listOfAttributes, obj) {
            for (let k in obj) {
                if (typeof obj[k] === "object" && !Object.keys(obj[k]).find(attribute => attribute === "ocb_id")) {
                    traverseCompanionTemplate(listOfAttributes, obj[k]);
                } else {
                    listOfAttributes.push(obj[k]);
                }
            }
        }

        let template = JSON.parse(fs.readFileSync(path.join(__dirname, './companions/' + smartDataModel)));
        Object.keys(template).forEach(key => {
            if (key !== "id" && key !== "type") {
                let object_array = template[key];
                object_array.forEach(function(object){
                    traverseCompanionTemplate(listOfAttributes, object);
                });
            }
        });

        // Object.keys(template.Machines[0].Identification).forEach(function (key) {
        //     //console.log('Key : ' + key + ', Value : ' + template.Machines[0].Identification[key])
        //     listOfAttributes.push(template.Machines[0].Identification[key]);
        // });
        // Object.keys(template.Machines[0].State.Machine.Overview).forEach(function (key) {
        //     listOfAttributes.push(template.Machines[0].State.Machine.Overview[key]);
        // });
        // Object.keys(template.Machines[0].State.Machine.Flags).forEach(function (key) {
        //     listOfAttributes.push(template.Machines[0].State.Machine.Flags[key]);
        // });
        // Object.keys(template.Machines[0].State.Machine.Values).forEach(function (key) {
        //     listOfAttributes.push(template.Machines[0].State.Machine.Values[key]);
        // });

        for (el in listOfAttributes) {
            var attr = {};
            var contextMapping = {};
            //console.log(listOfAttributes[el])
            if (listOfAttributes[el].ocb_behaviour == 'Active') {
                attr = {
                    name: listOfAttributes[el].ocb_id,
                    type: listOfAttributes[el].ocb_type
                };
                contextMapping = {
                    ocb_id: listOfAttributes[el].ocb_id,
                    opcua_id: listOfAttributes[el].opcua_id,
                    object_id: listOfAttributes[el].opcua_id.split('.')[0],
                    inputArguments: []
                };
                active.push(attr);
                contexts.push(contextMapping);
            }
            if (listOfAttributes[el].ocb_behaviour == 'Passive') {
                attr = {
                    name: listOfAttributes[el].ocb_id,
                    type: listOfAttributes[el].ocb_type
                };

                contextMapping = {
                    ocb_id: listOfAttributes[el].ocb_id,
                    opcua_id: listOfAttributes[el].opcua_id,
                    object_id: listOfAttributes[el].opcua_id.split('.')[0],
                    inputArguments: []
                };
                lazy.push(attr);
                contextSubscriptionsMapping.push(contextMapping);
            }
        }

        obj[template.type] = {
            service: configJS.opcua.service,
            subservice: configJS.opcua.subservice,
            active: active,
            lazy: lazy,
            commands: commands
        };

        configJson.types = obj;

        context['id'] = configJS.opcua.agentId + template.id;
        context['type'] = template.type;
        context['service'] = configJS.opcua.service;
        context['subservice'] = configJS.opcua.service;
        context['polling'] = configJS.opcua.polling;
        context['mappings'] = [];
        context.mappings = contexts;
        configJson.contexts.push(context);
        contextSubscriptions['id'] = configJS.opcua.agentId + template.id;
        contextSubscriptions['type'] = template.type;
        contextSubscriptions['mappings'] = [];
        contextSubscriptions.mappings = contextSubscriptionsMapping;
        configJson.contextSubscriptions.push(contextSubscriptions);

        return configJson;
    }
};
