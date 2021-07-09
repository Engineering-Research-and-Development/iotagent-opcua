module.exports = {
    findType: function(name, device) {
        // TODO we only search the 'active' namespace: does it make sense? probably yes
        if (device == undefined) return null;
        if (device.active == undefined) return null;

        for (var i = 0; i < device.active.length; i++) {
            if (device.active[i].name === name) {
                return device.active[i].type;
            }
        }
        return null;
    }
};
