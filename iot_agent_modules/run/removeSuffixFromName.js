module.exports = {
    removeSuffixFromName: function(name, suffix) {
        if (name.indexOf(suffix) > -1) {
            var str = name.replace(suffix, '');
            return str;
        }
        return name;
    }
};
