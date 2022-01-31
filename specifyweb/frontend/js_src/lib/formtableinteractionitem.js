"use strict";

import FormTable from './formtable';
import schema from './schema';
import { userInformation } from './userinfo';


export default FormTable.extend({
        __name__: "FormTableInteractionItemView",

        add: function(evt) {
            var self = this;
            evt.preventDefault();

            var table = self.collection.related.specifyModel.name.toLowerCase();
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: userInformation.id, type: 0, dbtableid: 1,
                           domainfilter: true, orderby: '-timestampcreated' }
            });
            var interactionresource = self.collection.related;
            var itemcollection = self.collection;
            recordSets.fetch({ limit: 5000 }).done(function() {
                console.info(recordSets);
                new (require('./interactiondialog'))({
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

