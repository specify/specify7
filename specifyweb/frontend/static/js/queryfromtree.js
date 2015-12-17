"use strict";

var $         = require('jquery');
var _         = require('underscore');

var schema         = require('./schema.js');
var domain         = require('./domain.js');
var QueryFieldSpec = require('./queryfieldspec.js');


    function paleoPathP() {
        return domain.getDomainResource('discipline').rget('paleocontextchildtable').pipe(function(table) {
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

    function buildQuery(tree, user, paleoPath, name, low, high) {
        var query = new schema.models.SpQuery.Resource();
        var model = schema.models.CollectionObject;
        query.set({
            'name': model.getLocalizedName() + " in " + name,
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

        return query.rget('fields').pipe(function(queryFields) {
            queryFields.add( fieldsFor[tree.name](model, low, high, paleoPath) );
            return query;
        });
    }

    function makeField(model, path, options) {
        var pathArray = [model.name].concat(path.split('.'));
        var fieldSpec = QueryFieldSpec.fromPath(pathArray);
        return new schema.models.SpQueryField.Resource()
            .set(fieldSpec.toSpQueryAttrs())
            .set(options);
    }

    var fieldsFor = {
        Taxon: function(model, low, high) {
            var position = 0;
            return [
                makeField(model, 'catalogNumber', {
                    'sorttype': 1,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.taxon.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.taxon.nodenumber', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '' + low + ',' + high,
                    'operstart': 9,
                    'position': position++
                }),
                makeField(model, 'determinations.isCurrent', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 6,
                    'position': position++
                })
            ];
        },
        Geography: function(model, low, high) {
            var position = 0;
            return [
                makeField(model, 'catalogNumber', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.taxon.fullName', {
                    'sorttype': 1,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.isCurrent', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 6,
                    'position': position++
                }),
                makeField(model, 'collectingEvent.locality.localityName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'collectingEvent.locality.geography.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'collectingEvent.locality.geography.nodenumber', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '' + low + ',' + high,
                    'operstart': 9,
                    'position': position++
                })
            ];
        },
        Storage: function(model, low, high) {
            var position = 0;
            return [
                makeField(model, 'catalogNumber', {
                    'sorttype': 1,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.taxon.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.isCurrent', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 6,
                    'position': position++
                }),
                makeField(model, 'preparations.storage.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'preparations.storage.nodenumber', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '' + low + ',' + high,
                    'operstart': 9,
                    'position': position++
                })
            ];
        },
        GeologicTimePeriod: function(model, low, high, paleoPath) {
            var position = 0;
            return [
                makeField(model, 'catalogNumber', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.taxon.fullName', {
                    'sorttype': 1,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.isCurrent', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 6,
                    'position': position++
                }),

                makeField(model, paleoPath + '.chronosStrat.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, paleoPath + '.chronosStrat.nodenumber', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '' + low + ',' + high,
                    'operstart': 9,
                    'position': position++
                })
            ];
        },
        LithoStrat: function(model, low, high, paleoPath) {
            var position = 0;
            return [
                makeField(model, 'catalogNumber', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.taxon.fullName', {
                    'sorttype': 1,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'determinations.isCurrent', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 6,
                    'position': position++
                }),
                makeField(model, paleoPath + '.lithoStrat.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, paleoPath + '.lithoStrat.nodenumber', {
                    'sorttype': 0,
                    'isdisplay': false,
                    'isnot': false,
                    'startvalue': '' + low + ',' + high,
                    'operstart': 9,
                    'position': position++
                })
            ];
        }
    };

module.exports =  function(user, table, nodeId) {
        var tree = schema.getModel(table);
        var node = new tree.Resource({id: nodeId});
        var next = buildQuery.bind(null, tree, user);
        return $.when(paleoPathP(),
                      node.rget('fullname'),
                      node.rget('nodenumber'),
                      node.rget('highestchildnodenumber')
                     ).pipe(next);
    };

