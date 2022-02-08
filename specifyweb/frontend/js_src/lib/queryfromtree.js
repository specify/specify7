"use strict";

import Q from 'q';

import {schema, getModel} from './schema';
import {QueryFieldSpec} from './queryfieldspec';
import {getDomainResource} from "./treedefinitions";


function paleoPathP() {
    return getDomainResource('discipline').rget('paleocontextchildtable').pipe(function(table) {
        switch (table.toLowerCase()) {
        case 'collectionobject':
            return 'paleoContext';
        case 'collectingevent':
            return 'collectingevent.paleoContext';
        case  'locality':
            return 'collectingevent.locality.paleoContext';
        default:
            throw new Error("unknown paleocontext child table: " + table);
        }
    });
}

function buildQuery(tree, user, paleoPath, fullname, nodeId, treedefitem) {
    const query = new schema.models.SpQuery.Resource();
    const model = schema.models.CollectionObject;
    query.set({
        'name': `${model.getLocalizedName()} in ${fullname}`,
        'contextname': model.name,
        'contexttableid': model.tableId,
        'selectdistinct': false,
        'countonly': false,
        'specifyuser': user.resource_uri,
        'isfavorite': true,
        // ordinal seems to always get set to 32767 by Specify 6
        // needs to be set for the query to be visible in Specify 6
        'ordinal': 32767
    });

    return Q(query.rget('fields')).then(queryFields => {
        queryFields.add( fieldsFor[tree.name](model, nodeId, treedefitem.get('name'), paleoPath) );
        return query;
    });
}

function makeField(model, path, treeRank, options) {
    const pathArray = [model.name].concat(path.split('.'));
    const fieldSpec = QueryFieldSpec.fromPath(pathArray);
    fieldSpec.treeRank = treeRank != null ? treeRank + ' ID' : null;

    return new schema.models.SpQueryField.Resource()
        .set(fieldSpec.toSpQueryAttrs())
        .set(options);
}

var fieldsFor = {
    Taxon: function(model, nodeId, rank) {
        var position = 0;
        return [
            makeField(model, 'catalogNumber', null, {
                'sorttype': 1,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.taxon.fullName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.taxon', rank, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': nodeId,
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.isCurrent', null, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': '',
                'operstart': 6,
                'position': position++
            })
        ];
    },
    Geography: function(model, nodeId, rank) {
        var position = 0;
        return [
            makeField(model, 'catalogNumber', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.taxon.fullName', null, {
                'sorttype': 1,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.isCurrent', null, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': '',
                'operstart': 13,
                'position': position++
            }),
            makeField(model, 'collectingEvent.locality.localityName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'collectingEvent.locality.geography.fullName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'collectingEvent.locality.geography', rank, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': nodeId,
                'operstart': 1,
                'position': position++
            })
        ];
    },
    Storage: function(model, nodeId, rank) {
        var position = 0;
        return [
            makeField(model, 'catalogNumber', null, {
                'sorttype': 1,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.taxon.fullName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.isCurrent', null, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': '',
                'operstart': 13,
                'position': position++
            }),
            makeField(model, 'preparations.storage.fullName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'preparations.storage', rank, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': nodeId,
                'operstart': 1,
                'position': position++
            })
        ];
    },
    GeologicTimePeriod: function(model, nodeId, rank, paleoPath) {
        var position = 0;
        return [
            makeField(model, 'catalogNumber', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.taxon.fullName', null, {
                'sorttype': 1,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.isCurrent', null, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': '',
                'operstart': 13,
                'position': position++
            }),

            makeField(model, paleoPath + '.chronosStrat.fullName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, paleoPath + '.chronosStrat', rank, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': nodeId,
                'operstart': 1,
                'position': position++
            })
        ];
    },
    LithoStrat: function(model, nodeId, rank, paleoPath) {
        var position = 0;
        return [
            makeField(model, 'catalogNumber', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.taxon.fullName', null, {
                'sorttype': 1,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, 'determinations.isCurrent', null, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': '',
                'operstart': 13,
                'position': position++
            }),
            makeField(model, paleoPath + '.lithoStrat.fullName', null, {
                'sorttype': 0,
                'isdisplay': true,
                'isnot': false,
                'startvalue': '',
                'operstart': 1,
                'position': position++
            }),
            makeField(model, paleoPath + '.lithoStrat', rank, {
                'sorttype': 0,
                'isdisplay': false,
                'isnot': false,
                'startvalue': nodeId,
                'operstart': 1,
                'position': position++
            })
        ];
    }
};

export default function(user, table, nodeId) {
    const tree = getModel(table);
    const node = new tree.Resource({id: nodeId});
    return Promise.resolve(Q([
        paleoPathP(),
        node.rget('fullname'),
        nodeId,
        node.rget('definitionitem', true),
    ]).spread((...args) => buildQuery(tree, user, ...args)));
};

