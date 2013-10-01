define(['jquery', 'text!context/datamodel.json!noinline'], function($, json) {
    return $.parseJSON(json);
});
