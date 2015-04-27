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
	interactionAction: function(evt) {
            var index = this.getIndex(evt, 'a.interaction-action');
            this.$el.dialog('close');
	    var recordSet =  this.options.recordSets.at(index);
	    var action = this.options.action;
	    api.getPrepsAvailableForLoan(recordSet.get('id')).done(function(prepsData) {
		var ipreps = _.map(prepsData, function(iprepData) {
		    return {catalognumber: iprepData[0],
			    preparationid: iprepData[1],
			    preptype: iprepData[2],
			    countamt: iprepData[3],
			    loaned: iprepData[4],
			    gifted: iprepData[5],
			    exchanged: iprepData[6],
			    available: iprepData[7]
			   };
		    });
		new PrepSelectDialog({preps: ipreps, action: action }).render();
	    });
	}
    });
});
