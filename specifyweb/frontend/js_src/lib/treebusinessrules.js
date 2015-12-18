"use strict";
var Q = require('q');
var _ = require('underscore');

    function buildFullName(resource, options) {
        return Q.all([resource, [], true,
                      resource.getRelated('parent', {prePop: true, noBusinessRules: true}),
                      resource.getRelated('definitionitem', {prePop: true, noBusinessRules: true})
                     ])
            .spread(_buildFullName)
            .then(
                function(acc) {
                    return {
                        key: 'tree-structure',
                        valid: true,
                        action: function() {
                            return resource.set('fullname', acc.reverse().join(' '));
                        }
                    };
                },
                function(error) {
                    if (error === 'bad-tree-structure' && options.reportBadStructure)
                        return {
                            key: 'tree-structure',
                            valid: false,
                            reason: 'Bad tree structure.'
                        };
                    else throw error;
                }
            );
    }

    function _buildFullName(resource, acc, start, parent, defitem) {
        if (parent && (parent.get('rankid') >= resource.get('rankid'))) {
            throw 'bad-tree-structure';
        }
        if (start || defitem.get('isinfullname')) acc.push(resource.get('name'));
        if (parent == null) {
            return acc;
        } else {
            return Q.all([parent, acc, false,
                          parent.getRelated('parent', {prePop: true, noBusinessRules: true}),
                          parent.getRelated('definitionitem', {prePop: true, noBusinessRules: true})
                         ]).spread(_buildFullName);
        }
    };

    var treeBusinessRules = {
        isTreeNode: function(resource) {
            var model;
            model = resource.specifyModel;
            return _.all(['parent', 'definition', 'definitionitem'], function(field) {
                return model.getField(field) != null;
            });
        },
        run: function(resource, fieldName) {
            var promise;
            switch (fieldName) {
            case 'parent':
                // only report bad tree structure as a problem with the parent field.
                promise = buildFullName(resource, {reportBadStructure: true});
                break;
            case 'name':
                promise = buildFullName(resource, {reportBadStructure: false});
                break;
            default:
                promise = Q(null);
            }

            promise.then(function(result) { console.debug('Tree BR finished',
                                                          {node: resource, field: fieldName},
                                                          result); });
            return promise;
        },
        init: function(resource) {
            resource.isNew() && resource.set('isaccepted', true);
        }
    };

module.exports = treeBusinessRules;

