define(['jquery', 'requireresource!context/domain.json'], function($, json) {
    "use strict";
    return $.parseJSON(json);
});
