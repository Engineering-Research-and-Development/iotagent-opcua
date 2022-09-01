module.exports = {
    dataTypes: async function(data) {
        var types = {};

        for (i in data.organizes) {
            if (data.organizes[i].browseName == 'DataTypes') {
                for (j in data.organizes[i].organizes) {
                    if (data.organizes[i].organizes[j].browseName == 'BaseDataType') {
                        for (k in data.organizes[i].organizes[j].hasSubtype) {
                            types[data.organizes[i].organizes[j].hasSubtype[k].nodeId] =
                                data.organizes[i].organizes[j].hasSubtype[k].browseName;
                        }
                    }
                }
            }
        }
        return types;
    }
};
