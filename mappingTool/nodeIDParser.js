module.exports = {
    nodeIDParser: function(nodeId, ignoreNs) {
        const ignoreNsList = ignoreNs.split(',');
        const node = nodeId.split(';');

        for (i in ignoreNsList) {
            if ('ns=' + ignoreNsList[i] == node[0].toString().toLowerCase()) return true;
        }
        return false;
    }
};
