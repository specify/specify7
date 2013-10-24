define(['jquery', 'text!context/domain.json!noinline'], function($, json) {
    "use strict";
    return $.parseJSON(json);
});
