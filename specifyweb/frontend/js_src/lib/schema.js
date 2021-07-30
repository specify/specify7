"use strict";

// This is a composition model that loads the Specify datamodel JSON and
// reifies it into the objects defined in specifymodel.js and
// specifyfield.js.

import schema from './schemabase';
import extras from './schemaextras';
import * as initialContext from './initialcontext';

import './specifymodel';
import './specifyfield';

schema.models = {};
initialContext.load('datamodel.json', tables => tables.forEach(tableDef => {
    const model = new schema.Model(tableDef);
    const extra = extras[model.name];
    extra && extra(model);
    schema.models[model.name] = model;
}));


export default schema;
