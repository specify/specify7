define(['jquery', 'underscore'], function($, _) {
    "use strict";

    var treeBusinessRules = {
        isTreeNode: function(resource) {
            var model;
            model = resource.specifyModel;
            return _.all(['parent', 'definition', 'definitionitem'], function(field) {
                return model.getField(field) != null;
            });
        },
        run: function(resource, fieldName) {
            if (treeBusinessRules.isTreeNode(resource) && _(['parent', 'definitionitem', 'name']).contains(fieldName)) {
                return treeBusinessRules.buildFullName(resource, [], true).pipe(
                    function(acc) {
                        return {
                            key: 'tree-structure',
                            valid: true,
                            action: function() {
                                return resource.set('fullname', acc.reverse().join(' '));
                            }
                        };
                    },
                    function(reason) {
                        return (fieldName == 'parent') && $.when({
                            key: 'tree-structure',
                            valid: false,
                            reason: reason
                        });
                    }
                );
            }
            return undefined;
        },
        buildFullName: function(resource, acc, start) {
            var recur;
            recur = function(parent, defitem) {
                if (parent && (parent.get('rankid') >= resource.get('rankid'))) {
                    return $.Deferred().reject('Bad tree structure');
                }
                if (start || defitem.get('isinfullname')) acc.push(resource.get('name'));
                if (!(parent != null)) {
                    return acc;
                } else {
                    return treeBusinessRules.buildFullName(parent, acc);
                }
            };
            return $.when(resource.rget('parent', true), resource.rget('definitionitem', true)).pipe(recur);
        }
    };

    return treeBusinessRules;
});
