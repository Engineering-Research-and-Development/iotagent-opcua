module.exports = {
    nodeIDParser: function (nodeId, ignoreNs) {
        const node = nodeId.split(';');

        if (ignoreNs.toString().includes(',')) {
            const ignoreNsList = ignoreNs.split(',');

            for (i in ignoreNsList) {
                if ('ns=' + ignoreNsList[i] == node[0].toString().toLowerCase()) return true;
            }
        } else {
            if ('ns=' + ignoreNs == node[0].toString().toLowerCase()) {
                return true;
            } else {
                return false;
            }
        }

        return false;
    }
};
