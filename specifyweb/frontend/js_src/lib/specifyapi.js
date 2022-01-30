"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import * as querystring from './querystring';


export default _.extend({}, Backbone.Events, {
        queryCbxExtendedSearch: function(templateResource, forceCollection) {
            var url = '/express_search/querycbx/' +
                    templateResource.specifyModel.name.toLowerCase() +
                    '/';
            var data = {};
            _.each(templateResource.toJSON(), function(value, key) {
                var field = templateResource.specifyModel.getField(key);
                if (field && !field.isRelationship && value) {
                    data[key] = value;
                }
            });

            forceCollection && (data['forcecollection'] = forceCollection.id);

            return $.get(url, data).pipe(function(results) {
                return new templateResource.specifyModel.StaticCollection(results);
            });
        },
        getTreePath: function(treeResource) {
            if (treeResource.id == null) return $.when(null);
            var model = treeResource.specifyModel.name.toLowerCase();
            var url = '/api/specify_tree/' + model + '/' + treeResource.id + '/path/';
            return $.get(url).promise();
        },
        getPrepsAvailableForLoanRs: function(recordSetId) {
            return $.get('/interactions/preparations_available_rs/' + recordSetId + '/');
        },
        getPrepsAvailableForLoanCoIds: function(idFld, collectionObjectIds) {
            return $.post('/interactions/preparations_available_ids/', {id_fld: idFld, co_ids: collectionObjectIds});
        },
        returnAllLoanItems: function(loanIds, returnedById, returnedDate, selection) {
            return $.post('/interactions/loan_return_all/', {loanIds: loanIds, returnedById: returnedById, returnedDate: returnedDate, selection: selection});
        },
        getInteractionsForPrepIds: function(prepIds) {
            return $.post('/interactions/prep_interactions/', {prepIds: prepIds});
        },
        getPrepAvailability: function(prepId, iPrepId, iPrepName) {
            var uri = '/interactions/prep_availability/' + prepId + '/';
            if (typeof iPrepId != 'undefined') {
                uri += iPrepId + '/' + iPrepName + '/';
            }
            return $.get(uri);
        }
    });

export function makeResourceViewUrl(tableName, resourceId = undefined, recordSetId = undefined) {
  const url = `/specify/view/${tableName.toLowerCase()}/${resourceId ?? 'new'}/`;
  return recordSetId == null
    ? url
    : querystring.format(url, {recordsetid: recordSetId});
}
