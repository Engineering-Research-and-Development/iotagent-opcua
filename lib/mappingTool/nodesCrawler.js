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

async function nodesCrawler(mySession, data, crawler, configJS, configJson) {
    var dataTypes = require('./dataTypes');
    var objectFolder = require('./objectFolder');

    switch (data.browseName.toLowerCase()) {
        case 'objects':
            console.log('Browsing Objects Folder');
            configJson = await objectFolder.objectFolder(data, configJson, crawler, configJS);
            break;

        /*  case 'types':
            console.log('Browsing Types Folder');
            const dTypes = await dataTypes.dataTypes(data);
            break;

        case 'views':
            console.log('Browsing Views Folder');
            break;*/

        default:
            console.log(`Nothing to be browsed`);
    }
    return configJson;
}

exports.nodesCrawler = nodesCrawler;
