module.exports = {
    nodeIDParser(nodeId, ignoreNs) {
        const nodeNsId = nodeId.split(';')[0].split('=')[1];

        const ignoreNsList = ignoreNs.split(',');
        if (ignoreNsList) {
            for (let i = 0; i < ignoreNsList.length; i++) {
                if (ignoreNsList[i] === nodeNsId) {
                    return true;
                }
            }
        }

        return false;
    }
};
