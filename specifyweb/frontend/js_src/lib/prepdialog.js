"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema = require('./schema.js');
var s      = require('./stringlocalization.js');


module.exports =  Backbone.View.extend({
        __name__: "PrepDialog",
        className: "prepdialog table-list-dialog",
        colobjModel: schema.getModel("collectionobject"),
        detModel: schema.getModel("determination"),
        prepModel: schema.getModel("preparation"),
        loanModel: schema.getModel("loan"),
        giftModel: schema.getModel("gift"),
        exchModel: schema.getModel("exchangeout"),

        //ui elements stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        render: function() {
            var table = $('<table>');
            table.append(this.getTblHdr());
            var makeEntry = this.dialogEntry.bind(this);
            _.each(this.options.preps, function(prep, index) {
                _.each(makeEntry(prep, index), function(entry) {
                    table.append(entry);
                });
            });
            this.$el.append(table);
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: this.getDlgTitle(),
                maxHeight: 700,
                width: 600,
                buttons: this.buttons()
            });
            this.finishRender();

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

