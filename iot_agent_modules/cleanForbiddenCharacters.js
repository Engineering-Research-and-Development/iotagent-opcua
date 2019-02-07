module.exports = {
    cleanForbiddenCharacters: function(value) {
        regex = /\(|\)|\<|\>|\"|\'|\=|\;/g;
        subst = `*`;
        // The substituted value will be contained in the result variable
        if (value != null) return value.toString().replace(regex, subst);
        return value;
    }
};
