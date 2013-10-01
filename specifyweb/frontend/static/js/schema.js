define([
    'jquery', 'underscore', 'schemabase', 'schemaextras', 'load_datamodel',
    'specifymodel', 'specifyfield'
], function($, _, schema, extras, tables) {
    "use strict";

    schema.models = {};

    _.each(tables, function(tableDef) {
        var model = new schema.Model(tableDef);
        var extra = extras[model.name];
        extra && extra(model);
        schema.models[model.name] = model;
    });

    return schema;
});
