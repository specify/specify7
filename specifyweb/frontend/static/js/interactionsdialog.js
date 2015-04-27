define([
    'jquery', 'underscore', 'backbone', 'schema',
    'icons', 'specifyform', 'whenall',
    'text!context/app.resource?name=InteractionsTaskInit!noinline',
    'interactiondialog',
    'jquery-ui'
], function($, _, Backbone, schema, icons, specifyform,
            whenAll, interactionsTaskInit, InteractionDialog) {
    "use strict";

    var interaction_entries = _.filter(_.map($('entry', interactionsTaskInit), $), function(entry) {
	var isVisible = entry.attr('isonleft');
	if (isVisible) {
	    return isVisible == 'true';
	} else {
	    return false;
	}
    });

    function getTableForObjToCreate(action) {
	switch (action.attr('action')) {
	case 'NEW_LOAN':
	    return 'loan';
	    break;
	case 'NEW_GIFT':
	    return 'gift';
	    break;
	}
	return 'loan';
    };

    function isActionEntry(entry) {
	var actionAttr = entry.attr('action');
	if (actionAttr) {
	    return actionAttr != 'OpenNewView';
	} else {
	    return false;
	}
    };
	    
    var views = _.filter(interaction_entries, function(entry) {
	return !isActionEntry(entry);
    });

    var actions =_.map( _.filter(interaction_entries, isActionEntry), function(actionEntry) {
	actionEntry.table = getTableForObjToCreate(actionEntry);
	return actionEntry;
    });

    var formsPromise = whenAll(_.map(views, function(view) {
	return specifyform.getView(view.attr('view')).pipe(function(form) { return form; });
    }));

    return Backbone.View.extend({
        __name__: "InteractionsDialog",
        className: "interactions-dialog table-list-dialog",
        events: {
	    'click a.intercept-navigation': 'selected',
	    'click a.interaction-action': 'interactionActionClick'
	},
        render: function() {
            var render = this._render.bind(this);
            formsPromise.done(render);
            return this;
        },
        _render: function(forms) {
            this.forms = forms;
            var entries = _.map(interaction_entries, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Interactions",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{ text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            });
            return this;
        },
        dialogEntry: function(interaction_entry) {
            var img = $('<img>', { src: icons.getIcon(interaction_entry.attr('icon')) });
	    var link = isActionEntry(interaction_entry) ?
		    $('<a>').addClass("interaction-action").text(interaction_entry.attr('action')) :
		    $('<a>').addClass("intercept-navigation").text(interaction_entry.attr('view'));
	    return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        },
        selected: function(evt) {
            var index = this.$('a').filter(".intercept-navigation").index(evt.currentTarget);
            this.$el.dialog('close');
            var form = this.forms[index];
            var model = schema.getModel(form['class'].split('.').pop());
            this.trigger('selected', model);
        },
	isRsAction: function(actionName) {
	    return actionName == 'NEW_GIFT' || actionName == 'NEW_LOAN';
	},
	interactionActionClick: function(evt) {
            var index = this.$('a').filter(".interaction-action").index(evt.currentTarget);
            this.$el.dialog('close');
            var action = actions[index];
	    if (this.isRsAction(action.attr('action'))) {
		var app = require('specifyapp');
		var recordSets = new schema.models.RecordSet.LazyCollection({
                    filters: { specifyuser: app.user.id, dbtableid: 1, orderby: '-timestampcreated' }
		});
		recordSets.fetch({ limit: 5000 }).done(function() {
		    new InteractionDialog({ recordSets: recordSets, action: action }).render();
		});				   
	    } else {
		alert(action.attr('action') + " action is not supported.");
	    }
	}
    });
});
