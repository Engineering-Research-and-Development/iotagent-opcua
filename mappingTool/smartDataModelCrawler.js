module.exports = {
    smartDataModelCrawler: async function(properties, smartDataModel, configJson) {
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

        let template = JSON.parse(fs.readFileSync(path.join(__dirname, '../companions/' + smartDataModel)));
        console.log(template);

        obj[template.type] = {
            service: properties.get('fiware-service'),
            subservice: properties.get('fiware-service-path'),
            active: active,
            lazy: lazy,
            commands: commands
        };

        configJson.types = obj;

        context['id'] = template.id;
        context['type'] = template.type;
        context['service'] = properties.get('fiware-service');
        context['subservice'] = properties.get('fiware-service-path');
        context['polling'] = properties.get('polling');
        context['mappings'] = [];
        context.mappings = contexts;
        configJson.contexts.push(context);
        contextSubscriptions['id'] = template.id;
        contextSubscriptions['type'] = template.type;
        contextSubscriptions['mappings'] = [];
        contextSubscriptions.mappings = contextSubscriptionsMapping;
        configJson.contextSubscriptions.push(contextSubscriptions);

        return configJson;
    }
};
