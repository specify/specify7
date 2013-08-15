define([
    'jquery', 'underscore', 'schemabase', 'schemaextras',
    'text!context/datamodel.json!noinline',
    'specifymodel', 'specifyfield'
], function($, _, schema, extras, json) {
    "use strict";
    var tables = $.parseJSON(json);

    schema.models = {};

    _.each(tables, function(tableDef) {
        var model = new schema.Model(tableDef);
        var extra = extras[model.name];
        extra && extra(model);
        schema.models[model.name] = model;
    });

    return schema;
});
