define([
    'jquery', 'underscore', 'backbone', 'schema',
    'icons', 'specifyform', 'whenall', 'recordsetsdialog',
    'jquery-ui'
], function($, _, Backbone, schema, icons, specifyform,
            whenAll, RecordSetsDialog) {
    "use strict";


    return RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        className: "recordsetsdialog interaction-dialog",
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
            console.info(this.options.action.attr('action') + ", " + recordSet.get('name'));
	    var recordSetItems = new schema.models.RecordSetItem.LazyCollection({
		filters: { recordset: recordSet.get('id') }
	    });
	    recordSetItems.fetch().done(function() {
		recordSetItems.each(function(item) {
		    console.info(item.get('recordid'));
		});
	    });
	}
        /*render: function(forms) {
            $('<body>').append("Interaction Action Control Center").appendTo(this.el);
	    var self = this;
            this.$el.dialog({
                title: "Interaction",
                maxHeight: 400,
                modal: true,
                close: function() { 
		    if ($(this).dialog('option', 'go')) {
			self.executeAction(); 
		    }
		    $(this).remove(); 
		},
                buttons: [
		    { text: 'OK', click: function() { 
			$(this).dialog('option', 'go', true);
			$(this).dialog('close'); } },
		    { text: 'Cancel', click: function() { $(this).dialog('close'); } }
		]
            });
            return this;
        },
	executeAction: function() {
	    this.$el.dialog('close');
	    this.trigger('exec-interaction-action');
	}*/
    });
});
