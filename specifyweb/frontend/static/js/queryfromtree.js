define([
    'jquery', 'underscore', 'schema', 'queryfieldspec'
], function($, _, schema, QueryFieldSpec) {
    "use strict";

    function buildQuery(tree, user, name, low, high) {
        var query = new schema.models.SpQuery.Resource();
        var model = baseTableFor[tree.name];
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
            queryFields.add( fieldsFor[tree.name](model, low, high) );
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

    var baseTableFor = {
        Taxon: schema.models.CollectionObject,
        Geography: schema.models.Locality
    };

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
                makeField(model, 'localityName', {
                    'sorttype': 1,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'geography.fullName', {
                    'sorttype': 0,
                    'isdisplay': true,
                    'isnot': false,
                    'startvalue': '',
                    'operstart': 1,
                    'position': position++
                }),
                makeField(model, 'geography.nodenumber', {
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

    return function(user, table, nodeId) {
        var tree = schema.getModel(table);
        var node = new tree.Resource({id: nodeId});
        var next = buildQuery.bind(null, tree, user);
        return $.when(node.rget('fullname'), node.rget('nodenumber'), node.rget('highestchildnodenumber')).pipe(next);
    };
});
