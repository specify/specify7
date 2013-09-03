define([
    'jquery', 'underscore', 'schemabase', 'schemaextras',
    'text!resources/specify_datamodel.xml!noinline',
    'specifymodel', 'specifyfield'
], function($, _, schema, extras, xml) {
    "use strict";

    schema.models = {};

    $('table', $.parseXML(xml)).each(function() {
        var model = new schema.Model(this);
        var extra = extras[model.name];
        extra && extra(model);
        schema.models[model.name] = model;
    });

    return schema;
});
