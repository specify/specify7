module.exports = function(value, message) {
        if (!value) {
            throw new Error(message);
        }
    };

