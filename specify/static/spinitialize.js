(function (specify, $, undefined) {
    "use strict";

    specify.initialize = function () {
        var deferreds = $.map(specify.initializers || [], function (init, i) {
            return init();
        });
        return $.when.apply($, deferreds).promise();
    };

    specify.addInitializer = function (init) {
        specify.initializers = specify.initializers || [];
        specify.initializers.push(init);
    };

} (window.specify = window.specify || {}, jQuery));

