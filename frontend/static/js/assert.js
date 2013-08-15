define([], function() {
    return function(value, message) {
        if (!value) {
            throw new Error(message);
        }
    };
});
