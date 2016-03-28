"use strict";
const Q = require('q');
const _ = require('underscore');
const schema = require('./schema.js');
const userInfo = require('./userinfo.js');

function addSuffix(name, usedNames) {
    let i = 1, newName;
    do {
        const suffix = ` (${i++})`;
        newName = name.substr(0, 64 - suffix.length) + suffix;
    } while (_(usedNames).contains(newName));
    return newName;
}

module.exports = function uniquifyWorkbenchName(name, existingId) {
    name = name.trim().substr(0, 64);
    const wbs = new schema.models.Workbench.LazyCollection({
        filters: { specifyuser: userInfo.id }
    });
    return Q(wbs.fetch({ limit: 0 }))
        .then(() => wbs.filter(wb => wb.id !== existingId))
        .then(wbs => wbs.map(wb => wb.get('name')))
        .then(usedNames =>
              _(usedNames).contains(name) ? addSuffix(name, usedNames) : name);
};
