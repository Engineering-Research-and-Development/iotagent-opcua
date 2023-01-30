/*
 * Copyright 2022 Engineering Ingegneria Informatica S.p.A.
 *
 * This file is part of iotagent-opcua
 *
 * iotagent-opcua is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-opcua is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-opcua.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[manfredi.pistone@eng.it, gabriele.deluca@eng.it, walterdomenico.vergara@eng.it, mattiagiuseppe.marzano@eng.it]
 */

/* eslint-disable no-unused-vars */

const fs = require('fs');
const path = require('path');

async function smartDataModelCrawler(configJS, smartDataModel, configJson) {
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
            if (typeof obj[k] === 'object' && !Object.keys(obj[k]).find((attribute) => attribute === 'ocb_id')) {
                traverseCompanionTemplate(listOfAttributes, obj[k]);
            } else {
                listOfAttributes.push(obj[k]);
            }
        }
    }

    let template = JSON.parse(fs.readFileSync(path.join(__dirname, './companions/' + smartDataModel)));
    Object.keys(template).forEach((key) => {
        if (key !== 'id' && key !== 'type') {
            let object_array = template[key];
            object_array.forEach(function (object) {
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

    context['id'] = configJS.mappingTool.agentId + template.id;
    context['type'] = template.type;
    context['service'] = configJS.opcua.service;
    context['subservice'] = configJS.opcua.service;
    context['polling'] = configJS.mappingTool.polling;
    context['mappings'] = [];
    context.mappings = contexts;
    configJson.contexts.push(context);
    contextSubscriptions['id'] = configJS.mappingTool.agentId + template.id;
    contextSubscriptions['type'] = template.type;
    contextSubscriptions['mappings'] = [];
    contextSubscriptions.mappings = contextSubscriptionsMapping;
    configJson.contextSubscriptions.push(contextSubscriptions);

    return configJson;
}

exports.smartDataModelCrawler = smartDataModelCrawler;
