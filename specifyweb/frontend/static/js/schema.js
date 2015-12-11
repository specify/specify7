define([
    'schemabase', 'schemaextras', 'initialcontext',
    'specifymodel', 'specifyfield'
], function(schema, extras, initialContext) {
    "use strict";

    schema.models = {};
    initialContext.load('datamodel.json', tables => tables.forEach(
        function(tableDef) {
            var model = new schema.Model(tableDef);
            var extra = extras[model.name];
            extra && extra(model);
            schema.models[model.name] = model;
        })
    );

    return schema;
});
