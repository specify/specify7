define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'populateform', 'savebutton', 'deletebutton', 
    'specifyapi', 'resourceview', 'fieldformat',
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, navigation, populateform,
            SaveButton, DeleteButton, api, ResourceView, FieldFormat) {
    "use strict";

    return Backbone.View.extend({
        __name__: "PrepSelectDialog",
        className: "prepselectdialog table-list-dialog",
        events: {
	    'click a.prepselect-unavailable': 'prepInteractions',
	    'click :checkbox': 'prepCheck'
	},
	colobjModel: schema.getModel("collectionobject"),
	detModel: schema.getModel("determination"),
	prepModel: schema.getModel("preparation"),
        render: function() {
            var table = $('<table>');
	    table.append('<tr><th>  </th>'
			 + '<th>' + this.colobjModel.getField('catalognumber').getLocalizedName() + '</th>'
			 + '<th>' + this.detModel.getField('taxon').getLocalizedName() + '</th>'
			 + '<th>' + this.prepModel.getField('preptype').getLocalizedName() + '</th>'
			 + '<th>Selected</th><th>Available</th><th>Unavailable</th></tr>');
            var makeEntry = this.dialogEntry.bind(this);
	    _.each(this.options.preps, function(recordSet) {
		table.append(makeEntry(recordSet));
            });
            this.$el.append(table);
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: "Preparations",
                maxHeight: 700,
		width: 600,
                buttons: this.buttons()
            });
	    var spinners = $(".prepselect-amt");
	    spinners.spinner({
		change: _.bind(function( evt ) {
		    var idx = $(".prepselect-amt").index(evt.currentTarget);
		    var max = this.options.preps[idx].available;
		    var min = 0;
		    var val = new Number(evt.currentTarget.value);
		    if (val > new Number(max)) {
			evt.currentTarget.value = max;
		    } else if (val < min) {
			evt.currentTarget.value = min;
		    }
		    $(':checkbox')[idx].checked = new Number(evt.currentTarget.value) > 0;
		}, this),
		//stop: _.bind(function( evt ) {
		//    var idx = $(".prepselect-amt").index(evt.target);
		//    $(':checkbox')[idx].checked = new Number(evt.currentTarget.value) > 0;
		//}, this),
		spin: _.bind(function( evt, ui ) {
		    var idx = $(".prepselect-amt").index(evt.target);
		    var max = this.options.preps[idx].available;
		    var min = 0;
		    var val = new Number(ui.value);
		    if (val > new Number(max) || val < min) {
			evt.cancelled = true;
		    } else {
			$(':checkbox')[idx].checked = val > 0;
		    }
		}, this)
	    });
            return this;
        },
	prepCheck: function( evt ) {
	    var idx = $(':checkbox').index( evt.target );
	    if (evt.target.checked) {
		$('.prepselect-amt')[idx].value = this.options.preps[idx].available;
	    } else {
		$('.prepselect-amt')[idx].value = '0';
	    }
	},
        dialogEntry: function(iprep) {
	    var unavailable = $('<td>').attr('align', 'center');
	    var unavailableCnt = iprep.countamt - iprep.available;
	    //if unavailable items, link to related interactions
	    if (unavailableCnt != 0) { 
		unavailable.append($('<a>').text(unavailableCnt).addClass('prepselect-unavailable'));
	    } else {
		unavailable.append(unavailableCnt).addClass('prepselect-unavailable');
	    }
	    var entry = $('<tr>').append(
		$('<td>').append($('<input>').attr('type', 'checkbox')),
                $('<td>').append(FieldFormat(this.colobjModel.getField('catalognumber'), iprep.catalognumber)),
                $('<td>').append(iprep.taxon),
                $('<td>').attr('align', 'center').append(iprep.preptype),
		$('<td>').append($('<input>').attr('align', 'right').attr('value', '0').attr('max', iprep.available).attr('min', 0).addClass('prepselect-amt')),
	        $('<td>').attr('align', 'center').append(iprep.available).addClass('prepselect-available'),
		unavailable);
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
	    //console.info('creating obj for ' + this.options.action.attr('action'));
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

	    interaction.set(itemModelName + 's', items);
	    var SpecifyApp = require('specifyapp');
	    SpecifyApp.setCurrentView(new ResourceView({model: interaction}));
	},
	prepInteractions: function(evt) {
            var idx = $(".prepselect-unavailable").index(evt.currentTarget);
	    var prepId = this.options.preps[idx].preparationid;
	    var parsePrepUse = function(p) {
		if (p) {
		    return _.map(p.split(','), function(o){
			var s = o.split('>|<'); 
			return {key: s[0], visibleKey: s[1]};
		    });	    
		} else {
		    return null;
		}
	    };
	    api.getInteractionsForPrepIds(prepId).done(function(result){
		var loans = parsePrepUse(result[0][1]);
		var gifts = parsePrepUse(result[0][2]);
		var exchs = parsePrepUse(result[0][3]);
		console.log(loans, gifts, exchs);
	    });
	},
        getIndex: function(evt, selector) {
            return this.$(selector).index(evt.currentTarget);
        },
	selectAll: function() {
	    var amounts = $(':input.prepselect-amt');
	    var availables = $('td.prepselect-available');
	    for (var p=0; p < availables.length; p++) {
		$(amounts[p]).attr('value', $(availables[p]).text());
	    };	  
	    $(':checkbox').attr('checked', true);
	},
	deSelectAll: function() {
	    //_.each($(':input.prepselect-amt'), function(item) {
		//$(item).attr('value', '0');
	    //});
	    $(':input.prepselect-amt').attr('value', '0');
	    $(':checkbox').attr('checked', false);
	}
    });


});
