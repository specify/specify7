define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi',
    'icons', 'specifyform', 'whenall', 'recordsetsdialog', 'prepselectdialog', 'uiformatters',
    'jquery-ui'
], function($, _, Backbone, schema, api, icons, specifyform,
            whenAll, RecordSetsDialog, PrepSelectDialog, uiformatters) {
    "use strict";

    return RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        className: "interactiondialog recordsetsdialog",
	events: {
	    'click a.rs-select': 'rsSelect',
	    'click a.co-entry': 'coEntry'
	},
	makeEntryLink: function(recordSet) {
	    return $('<a>').addClass("rs-select").text(recordSet.get('name'));
	},	
	makeUI: function() {
	    this.makeTable();
	    this.makeSpecNumUI();
	},
	makeSpecNumUI: function() {
	    this.$el.append('<div><a class="co-entry">Enter Specimen Numbers</a><textarea class="co-entry" rows=2></textarea></div>');
	},
	rsSelect: function(evt) {
            var index = this.getIndex(evt, 'a.rs-select');
	    var recordSet =  this.options.recordSets.at(index);
	    this.interactionAction(recordSet, true);
	},
	coEntry: function(evt) {
	    var numsCtrl = $('textarea.co-entry');
	    var nums=numsCtrl.attr('value');
	    var ids=uiformatters.getByName('CatalogNumberNumeric').canonicalize([nums]);
	    this.interactionAction(ids, false);
	},
	availablePrepsReady: function(action, prepsData) {
	    var ipreps = _.map(prepsData, function(iprepData) {
		return {catalognumber: iprepData[0],
			taxon: iprepData[1],
			preparationid: iprepData[2],
			preptype: iprepData[3],
			countamt: iprepData[4],
			loaned: iprepData[5],
			gifted: iprepData[6],
			exchanged: iprepData[7],
			available: iprepData[8]
		       };
	    });
	    new PrepSelectDialog({preps: ipreps, action: action }).render();
	},
	interactionAction: function(selection, isRs) {
            this.$el.dialog('close');
	    var action = this.options.action;
	    var prepsReady = _.bind(this.availablePrepsReady, this, action);
	    if (isRs) {
		api.getPrepsAvailableForLoanRs(selection.get('id')).done(prepsReady); 
	    } else {
		api.getPrepsAvailableForLoanCoIds(selection).done(prepsReady);
	    }
	}
    });
});
