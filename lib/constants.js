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

module.exports = {
    MEASURES_SUFIX: 'attrs',
    CONFIGURATION_SUFIX: 'configuration',
    CONFIGURATION_COMMAND_SUFIX: 'commands',
    CONFIGURATION_COMMAND_UPDATE: 'cmdexe',
    CONFIGURATION_VALUES_SUFIX: 'values',

    DATE_FORMAT: "yyyymmdd'T'HHMMss'Z'",

    HTTP_MEASURE_PATH: '/iot/d',
    HTTP_CONFIGURATION_PATH: '/configuration',
    HTTP_COMMANDS_PATH: '/commands',

    TIMESTAMP_ATTRIBUTE: 'TimeInstant',
    TIMESTAMP_TYPE_NGSI2: 'DateTime',

    DEFAULT_ATTRIBUTE_TYPE: 'string',

    COMMAND_STATUS_PENDING: 'PENDING',
    COMMAND_STATUS_ERROR: 'ERROR',
    COMMAND_STATUS_COMPLETED: 'OK',

    OPCUA_NGSI_BINDING_NUMBER: 'Number',
    OPCUA_NGSI_BINDING_DECIMAL128: 'Number',
    OPCUA_NGSI_BINDING_DOUBLE: 'Number',
    OPCUA_NGSI_BINDING_FLOAT: 'Number',
    OPCUA_NGSI_BINDING_INTEGER: 'Integer',
    OPCUA_NGSI_BINDING_UINTEGER: 'Integer',
    OPCUA_NGSI_BINDING_STRING: 'Text',
    OPCUA_NGSI_BINDING_BYTESTRING: 'Text'
};
