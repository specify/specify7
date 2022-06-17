"use strict";
import _ from 'underscore';
import {treeText} from './localization/tree';
import {ajax} from './ajax';
import {formatUrl} from './querystring';

function predictFullName(resource, options) {
    const treeName = resource.specifyModel.name.toLowerCase();
    return Promise.all([resource,
                  resource.getRelated('parent', {prePop: true, noBusinessRules: true}),
                  resource.getRelated('definitionitem', {prePop: true, noBusinessRules: true})
                 ])
        .then(([resource, parent, defitem]) => {
            if (parent == null || defitem == null) return null;
            if (parent.id === resource.id || parent.get('rankid') >= defitem.get('rankid')) {
                throw 'bad-tree-structure';
            }
            if (resource.get('name') == null) return null;
            return ajax(
                formatUrl(`/api/specify_tree/${treeName.toLowerCase()}/${parent.id}/predict_fullname/`,
                {
                  name: resource.get('name'),
                    treeDefItemId: defitem.id
                }),
              {
               headers: {'Accept': 'text/plain'}
            }).then(({data})=>data);
        })
        .then(
            fullname => ({
                key: 'tree-structure',
                valid: true,
                action() { return resource.set('fullname', fullname, {silent: true}); }
            }),
            error => {
                if (error === 'bad-tree-structure' && options.reportBadStructure)
                    return {
                        key: 'tree-structure',
                        valid: false,
                        reason: treeText('badStructure')
                    };
                else throw error;
            }
        );
}

    export const treeBusinessRules = {
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
                promise = predictFullName(resource, {reportBadStructure: true});
                break;
            case 'name':
            case 'definitionitem':
                promise = predictFullName(resource, {reportBadStructure: false});
                break;
            default:
                promise = Promise.resolve(null);
            }

            promise.then(function(result) { console.debug('Tree BR finished',
                                                          {node: resource, field: fieldName},
                                                          result); });
            return promise;
        },
        init: function(resource) {
          if(resource.isNew())resource.set('isAccepted', true, {silent:true});
        }
    };

