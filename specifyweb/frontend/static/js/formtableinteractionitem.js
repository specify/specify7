"use strict";

var FormTable = require('./formtable.js');
var schema    = require('./schema.js');
var userInfo  = require('./userinfo.js');


module.exports =  FormTable.extend({
        __name__: "FormTableInteractionItemView",

        add: function(evt) {
            var self = this;
            evt.preventDefault();

            var table = self.collection.related.specifyModel.name.toLowerCase();
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: userInfo.id, type: 0, dbtableid: 1,
                           domainfilter: true, orderby: '-timestampcreated' }
            });
            var interactionresource = self.collection.related;
            var itemcollection = self.collection;
            recordSets.fetch({ limit: 5000 }).done(function() {
                console.info(recordSets);
                new (require('./interactiondialog.js'))({
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

