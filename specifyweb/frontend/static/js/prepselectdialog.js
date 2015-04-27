define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'populateform', 'savebutton', 'deletebutton', 
    'specifyapi', 'resourceview',
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, navigation, populateform,
            SaveButton, DeleteButton, api, ResourceView) {
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
                maxHeight: 600,
                buttons: this.buttons()
            });
            return this;
        },
        dialogEntry: function(iprep) {
	    var entry = $('<tr>').append(
                $('<td>').append($('<a>').text(iprep.catalognumber)),
                $('<td>').append($('<a>').text(iprep.preptype)),
	        $('<td>').append($('<a>').text(iprep.available).addClass('prepselect-available')),
		$('<td>').append($('<input>').attr('value', iprep.available).addClass('prepselect-amt')));
            return entry;
        },
        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: 'Select All', click: this.selectAll,
                  title: 'Select all available preparations.' },
		{ text: 'De-select All', click: this.deSelectAll,
		  title: 'Clear all.' },
		{ text: 'OK', click: _.bind(this.makeInteraction, this),
		  title: 'Create ' + this.getTextForObjToCreate() }
            ];
            buttons.push({ text: 'Cancel', click: function() { $(this).dialog('close'); }});
            return buttons;
        },
	getTextForObjToCreate: function() {
	    //need to be nicer
	    return this.options.action.attr('action');
	},
	makeInteractionPrep: function(baseTbl, itemModel, iprep, amt) {
	    var result = new itemModel.Resource();
	    result.set('quantity', amt);
	    if (baseTbl == 'loan') {
		result.set('quantityReturned', 0);
		result.set('quantityResolved', 0);
	    }
	    var pmod = schema.getModel('preparation');
	    var purl = (new pmod.Resource({id: iprep.preparationid})).url();
	    result.set('preparation', purl);
	    return result;
	},
	makeInteraction: function() {
	    console.info('creating obj for ' + this.options.action.attr('action'));
	    var baseTbl = this.options.action.table;
            var baseModel = schema.getModel(baseTbl);
	    var interaction = new baseModel.Resource();
	    var itemModelName = baseTbl + 'preparation';
	    var itemModel = schema.getModel(itemModelName);
	    var items = [];
	    var amounts = $(':input.prepselect-amt');
	    for (var p=0; p < this.options.preps.length; p++) {
		var amt = $(amounts[p]).attr('value');
		if ('0' != amt && '' != amt) {
		    items[items.length] = this.makeInteractionPrep(baseTbl, itemModel, this.options.preps[p], amt);
		}
	    }

            //var interactionpreps = interaction.rget(itemModelName + 's');
	    
	    interaction.set(baseTbl + 'number', 'NEW INTERACTION');
	    interaction.set(itemModelName + 's', items);
	    var SpecifyApp = require('specifyapp');
	    SpecifyApp.setCurrentView(new ResourceView({model: interaction}));
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
