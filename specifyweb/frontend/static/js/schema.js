"use strict";
var schema         = require('./schemabase.js');
var extras         = require('./schemaextras.js');
var initialContext = require('./initialcontext.js');

require('./specifymodel.js');
require('./specifyfield.js');

    schema.models = {};
    initialContext.load('datamodel.json', tables => tables.forEach(
        function(tableDef) {
            var model = new schema.Model(tableDef);
            var extra = extras[model.name];
            extra && extra(model);
            schema.models[model.name] = model;
        })
    );

    module.exports = schema;
