define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi',
    'icons', 'specifyform', 'whenall', 'recordsetsdialog', 'prepselectdialog',
    'jquery-ui'
], function($, _, Backbone, schema, api, icons, specifyform,
            whenAll, RecordSetsDialog, PrepSelectDialog) {
    "use strict";

    return RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        className: "interactiondialog recordsetsdialog",
	events: {
	    'click a.interaction-action': 'interactionAction'
	},
	makeEntryLink: function(recordSet) {
	    return $('<a>').addClass("interaction-action").text(recordSet.get('name'));
	},	
	makeUI: function() {
	    this.makeTable();
	    this.makeSpecNumUI();
	},
	makeSpecNumUI: function() {
	    this.$el.append('<div><h4>Enter Specimen Numbers</h4><textarea rows=2></textarea></div>');
	},
	interactionAction: function(evt) {
            var index = this.getIndex(evt, 'a.interaction-action');
            this.$el.dialog('close');
	    var recordSet =  this.options.recordSets.at(index);
	    var action = this.options.action;
	    api.getPrepsAvailableForLoan(recordSet.get('id')).done(function(prepsData) {
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
	    });
	}
    });
});
