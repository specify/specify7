define([
    'jquery', 'underscore', 'backbone', 'schema',
    'icons', 'specifyform', 'whenall',
    'interactiondialog', 'props',
    'toolbarreport',
    'text!context/app.resource?name=InteractionsTaskInit!noinline',
    'text!properties/resources_en.properties!noinline',
    'jquery-ui'
], function($, _, Backbone, schema, icons, specifyform,
            whenAll, InteractionDialog, props, reps,
            interactionsTaskInit, resources_prop) {
    "use strict";

    var interaction_entries = _.filter(_.map($('entry', interactionsTaskInit), $), function(entry) {
        var isVisible = entry.attr('isonleft');
        if (isVisible) {
            return isVisible == 'true' && entry.attr('action') != 'LN_NO_PRP' ;
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
        getDialogEntryText: function(entry) {
            if (entry.attr('label')) {
                return props.getProperty(resources_prop, entry.attr('label'));
            } else if (entry.attr('table')) {
                return schema.getModel(entry.attr('table')).getLocalizedName();
            } else if (isActionEntry(entry)) {
                return entry.attr('action');
            } else {
                return entry.attr('table');
            }
        },
        addDialogEntryToolTip: function(entry, link) {
            var ttResourceKey = entry.attr('tooltip');
            if (ttResourceKey != '') {
                var tt = props.getProperty(resources_prop, ttResourceKey);
                if (tt) {
                    link.attr('title', tt);
                }
            }
        },
        dialogEntry: function(interaction_entry) {
            var img = $('<img>', { src: icons.getIcon(interaction_entry.attr('icon')) });
            var link = isActionEntry(interaction_entry) ?
                    $('<a>').addClass("interaction-action").text(this.getDialogEntryText(interaction_entry)) :
                    $('<a>').addClass("intercept-navigation").text(this.getDialogEntryText(interaction_entry));
            this.addDialogEntryToolTip(interaction_entry, link);
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
            var isRsAction = this.isRsAction(action.attr('action'));
            if (isRsAction || action.attr('action') == 'RET_LOAN') {
                var app = require('specifyapp');
                var tblId = isRsAction ? 1 : 52;
                var recordSets = new schema.models.RecordSet.LazyCollection({
                    filters: { specifyuser: app.user.id, type: 0, dbtableid: tblId,
                               domainfilter: true, orderby: '-timestampcreated' }
                });
                recordSets.fetch({ limit: 5000 }).done(function() {
                    new InteractionDialog({ recordSets: recordSets, action: action, readOnly: true, close: !isRsAction }).render();
                });
            } else if (action.attr('action') == 'PRINT_INVOICE') {
                //assuming loan invoice for now (52 is loan tableid)
                reps.execute(52, {prop: 'reporttype', val: 'invoice'}, true);
            } else {
                alert(action.attr('action') + " action is not supported.");
            }
        }
    });
});
