"use strict";
import $ from 'jquery';
import Q from 'q';
import _ from 'underscore';

function addSuffix(name, usedNames) {
    let i = 1, newName;
    do {
        const suffix = ` (${i++})`;
        newName = name.substr(0, 64 - suffix.length) + suffix;
    } while (_(usedNames).contains(newName));
    return newName;
}

export function uniquifyDataSetName(name, existingId) {
    name = name.trim().substr(0, 64);

    return Q($.get(`/api/workbench/dataset/`)).then(datasets => {
        const usedNames = datasets.filter(ds => ds.id !== existingId).map(ds => ds.name);
        return usedNames.includes(name) ? addSuffix(name, usedNames) : name;
    });
};
