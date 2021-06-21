"use strict";

// This is a composition model that loads the Specify datamodel JSON and
// reifies it into the objects defined in specifymodel.js and
// specifyfield.js.

const schema         = require('./schemabase.js');
const extras         = require('./schemaextras.js');
const initialContext = require('./initialcontext.js');

require('./specifymodel.js');
require('./specifyfield.js');

schema.models = {};
initialContext.load('datamodel.json', tables => tables.forEach(tableDef => {
    const model = new schema.Model(tableDef);
    const extra = extras[model.name];
    extra && extra(model);
    schema.models[model.name] = model;
}));


module.exports = schema;
