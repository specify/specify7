define([
    'require', 'jquery', 'underscore', 'backbone', 'formtable', 'schema'
], function(require, $, _, Backbone, FormTable, schema) {
    "use strict";

    return FormTable.extend({
        __name__: "FormTableInteractionItemView",

        add: function(evt) {
            var self = this;
            evt.preventDefault();

            var table = self.collection.related.specifyModel.name.toLowerCase();
            var app = require('specifyapp');
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: app.user.id, dbtableid: 1, orderby: '-timestampcreated' }
            });
            var interactionresource = self.collection.related;
            var itemcollection = self.collection;
            recordSets.fetch({ limit: 5000 }).done(function() {
                console.info(recordSets);
                new (require('interactiondialog'))({ 
                    recordSets: recordSets, 
                    action: {table: table},                      
                    readOnly: true, 
                    close: false, 
                    interactionresource: interactionresource,
                    itemcollection: itemcollection
                }).render();
            });
            
        }
    
    });
});
