define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'populateform', 'savebutton', 'deletebutton', 
    'specifyapi',
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, navigation, populateform,
            SaveButton, DeleteButton, api) {
    "use strict";

    return Backbone.View.extend({
        __name__: "PrepSelectDialog",
        className: "prepselectdialog table-list-dialog",
        render: function() {
            var table = $('<table>');
            table.append('<tr><th>Specimen Number</th><th>Preparation</th><th>Available</th><th>Selected</th></tr>');
            var makeEntry = this.dialogEntry.bind(this);
            _.each(this.options.preps, function(recordSet) {
                table.append(makeEntry(recordSet));
            });
            this.$el.append(table);
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: "Preparations",
                maxHeight: 500,
                buttons: this.buttons()
            });
            return this;
        },
        dialogEntry: function(prep) {
            var entry = $('<tr>').append(
                $('<td>').append($('<a>').text(prep[0])),
                $('<td>').append($('<a>').text(prep[2])),
                $('<td>').append($('<a>').text(prep[7]).addClass('prepselect-available')),
                $('<td>').append($('<input>').attr('value', prep[7]).addClass('prepselect-amt')));
            return entry;
        },
        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: 'Select All', click: this.selectAll,
                  title: 'Select all available preparations.' },
                { text: 'De-select All', click: this.deSelectAll,
                  title: 'Clear all.' },
                { text: 'OK', click: _.bind(this.createInteraction, this),
                  title: 'Create ' + this.getTextForObjToCreate() }
            ];
            buttons.push({ text: 'Cancel', click: function() { $(this).dialog('close'); }});
            return buttons;
        },
        getTextForObjToCreate: function() {
            //need to be nicer
            return this.options.action.attr('action');
        },
        getTableForObjToCreate: function(action) {
            switch (action.attr('action')) {
            case 'NEW_LOAN':
                return 'loan';
                break;
            case 'NEW_GIFT':
                return 'gift';
                break;
            }
            return 'loan';
        },
        createInteraction: function() {
            console.info('creating obj for ' + this.options.action.attr('action'));
            var baseTbl = this.getTableForObjToCreate(this.options.action);
            var baseModel = schema.getModel(baseTbl);
            var loan = new baseModel.Resource();
            var itemModel = schema.getModel(baseTbl+ 'preparation');
            var items = [];
            var amounts = $(':input.prepselect-amt');
            for (var p=0; p < this.options.preps; p++) {
                var amt = $(amounts[p]).attr('value');
                if ('0' != amt && '' != amt) {
                    var item = new itemModel.Resource();
                    
                }
            }

            loanpreps = loan.rget('loanpreparations')
app = require('specifyapp')
rv = require('resourceview')
app.setCurrentView(new rv({model: loan}))
            window.open(api.makeResourceViewUrl(baseModel));
        },
        getIndex: function(evt, selector) {
            evt.preventDefault();
            return this.$(selector).index(evt.currentTarget);
        },
        selectAll: function() {
            var amounts = $(':input.prepselect-amt');
            var availables = $('a.prepselect-available');
            for (var p=0; p < availables.length; p++) {
                $(amounts[p]).attr('value', $(availables[p]).text());
            };      
        },
        deSelectAll: function() {
            _.each($(':input.prepselect-amt'), function(item) {
                $(item).attr('value', '0');
            });
        }
    });


});
