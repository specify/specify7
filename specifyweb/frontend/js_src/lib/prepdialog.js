"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import schema from './schema';
import * as s from './stringlocalization';
import formsText from './localization/forms';


export default Backbone.View.extend({
    __name__: "PrepDialog",
    className: "prepdialog table-list-dialog",
    initialize() {
        Object.assign(this, {
            colobjModel: schema.getModel("collectionobject"),
            detModel: schema.getModel("determination"),
            prepModel: schema.getModel("preparation"),
            loanModel: schema.getModel("loan"),
            giftModel: schema.getModel("gift"),
            exchModel: schema.getModel("exchangeout")
        });
    },

        //ui elements stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        render: function() {
            var table = $('<table>');
            table.append(this.getTblHdr());
            const tbody = $('<tbody>').appendTo(table);
            var makeEntry = this.dialogEntry.bind(this);
            _.each(this.options.preps, function(prep, index) {
                _.each(makeEntry(prep, index), function(entry) {
                    tbody.append(entry);
                });
            });
            this.$el.append(table);
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: formsText('preparationsDialogTitle'),
                maxHeight: 700,
                width: 600,
                buttons: this.buttons()
            });

            return this;
        },

        //<<<<<<<<<<<<<<<<<<<< ui elements stuff

        //events >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        getIndex: function(evt, selector) {
            return this.$(selector).index(evt.currentTarget);
        },

        //<<<<<<<<<<<<<<<<<<<<<<< events

        getProp: function(key, fallback) {
            return s.localizeFrom('resources', key, fallback);
        }
    });

