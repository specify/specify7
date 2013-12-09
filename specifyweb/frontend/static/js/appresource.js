define(['jquery'], function($) {
    "use strict";

    var getAppResource = function(name) {
        return $.ajax('/context/app.resource', {
            data: {
                name: name
            }
        }).fail(function() {
            return console.log("warning: failed fetching appresource: " + name);
        });
    };

    return getAppResource;
});
