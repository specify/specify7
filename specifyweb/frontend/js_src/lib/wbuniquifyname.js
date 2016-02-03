"use strict";
const Q = require('q');
const _ = require('underscore');
const schema = require('./schema.js');
const userInfo = require('./userinfo.js');

function addSuffix(name, usedNames) {
    let i = 1, newName;
    do {
        newName = name + ' (' + (i++) + ')';
    } while (_(usedNames).contains(newName));
    return newName;
}

module.exports = function uniquifyWorkbenchName(name) {
    name = name.trim();
    const wbs = new schema.models.Workbench.LazyCollection({
        filters: { specifyuser: userInfo.id, name__startswith: name }
    });
    return Q(wbs.fetch({ limit: 0 }))
        .then(() => wbs.map(wb => wb.get('name')))
        .then(usedNames =>
              _(usedNames).contains(name) ? addSuffix(name, usedNames) : name);
};
