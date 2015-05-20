define([
    'jquery', 'underscore', 'backbone', 'schema'
], function($, _, Backbone, schema) {
    "use strict";

    var api =  _.extend({}, Backbone.Events, {
        getRows: function(table, options) {
            table = _.isString(table) ? table : table.name;
            var url = '/api/specify_rows/' + table.toLowerCase() + '/';
            var data = {
                fields: options.fields.join(',').toLowerCase(),
                limit: options.limit.toString(),
                distinct: options.distinct ? 'true' : 'false'
            };
            return $.get(url, data).promise();
        },
        getPickListByName: function(pickListName) {
            var collection = new schema.models.PickList.LazyCollection({
                filters: { name: pickListName },
                domainfilter: true
            });
            return collection.fetch({limit: 1}).pipe(function() { return collection.first(); });
        },
        getRecordSetItem: function(recordSet, index) {
            return $.when(recordSet.fetchIfNotPopulated(), $.get('/api/specify/recordsetitem/', {
                recordset: recordSet.id,
                offset: index,
                limit: 1
            })).pipe(function(__, data) {
                var itemData = data[0].objects[0];
                if (!itemData) return null;

                var specifyModel = schema.getModelById(recordSet.get('dbtableid'));
                return new specifyModel.Resource({ id: itemData.recordid });
            });
        },
        queryCbxSearch: function(model, searchfield, searchterm) {
            var filters = { orderby: searchfield.toLowerCase() };
            filters[searchfield.toLowerCase() + '__istartswith'] = searchterm;
            return new model.LazyCollection({ filters: filters, domainfilter: true });
        },
        queryCbxExtendedSearch: function(templateResource) {
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

            return $.get(url, data).pipe(function(results) {
                return new templateResource.specifyModel.StaticCollection(results);
            });
        },
        getCollectionObjectRelTypeByName: function(name) {
            var collection = new schema.models.CollectionRelType.LazyCollection({
                filters: { name: name }
            });
            return collection.fetch({limit: 1}).pipe(function() { return collection.first(); });
        },
        getTreePath: function(treeResource) {
            if (treeResource.id == null) return $.when(null);
            var model = treeResource.specifyModel.name.toLowerCase();
            var url = '/api/specify_tree/' + model + '/' + treeResource.id + '/path/';
            return $.get(url).promise();
        },
        makeResourceViewUrl: function(specifyModel, resourceId, recordSetId) {
            var url = '/specify/view/' + specifyModel.name.toLowerCase() + '/' + (resourceId || 'new') + '/';
            return $.param.querystring(url, {recordsetid: recordSetId});
        },
	getPrepsAvailableForLoanRs: function(recordSetId) {
	    return $.get('/api/preparations_available_rs/' + recordSetId + '/');
	},
	getPrepsAvailableForLoanCoIds: function(idFld, collectionObjectIds) {
	    return $.post('/api/preparations_available_ids/', {id_fld: idFld, co_ids: collectionObjectIds});
	},
	returnAllLoanItems: function(loanIds, returnedById, returnedDate, selection) {
	    return $.post('/api/loan_return_all/', {loanIds: loanIds, returnedById: returnedById, returnedDate: returnedDate, selection: selection});
	},
	getInteractionsForPrepIds: function(prepIds) {
	    return $.post('/api/prep_interactions/', {prepIds: prepIds});
	}
    });
    

    return api;
});
