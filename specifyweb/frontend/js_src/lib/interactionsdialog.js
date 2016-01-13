"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('q');


var schema            = require('./schema.js');
var icons             = require('./icons.js');
var specifyform       = require('./specifyform.js');
var initialContext    = require('./initialcontext.js');
var userInfo          = require('./userinfo.js');
var InteractionDialog = require('./interactiondialog.js');
var s                 = require('./stringlocalization.js');
var reports           = require('./reports.js');

    var interaction_entries, views, actions;

    initialContext.load('app.resource?name=InteractionsTaskInit', function (data) {
        interaction_entries = _.map($('entry', data), $)
            .filter(entry => entry.attr('isonleft') === 'true'  && entry.attr('action') != 'LN_NO_PRP');

        views = interaction_entries.filter(entry => !isActionEntry(entry));
        actions = interaction_entries.filter(isActionEntry);

        actions.forEach(actionEntry => actionEntry.table = getTableForObjToCreate(actionEntry));
    });

    function getTableForObjToCreate(action) {
        switch (action.attr('action')) {
        case 'NEW_LOAN':
            return 'loan';
        case 'NEW_GIFT':
            return 'gift';
        default:
            return 'loan';
        }
    }

    function isActionEntry(entry) {
        var actionAttr = entry.attr('action');
        return actionAttr && actionAttr != 'OpenNewView';
    }

    function getFormsPromise() {
        return Q.all(views.map(view => Q(specifyform.getView(view.attr('view'))).then(form => form)));
    }

module.exports = Backbone.View.extend({
        __name__: "InteractionsDialog",
        className: "interactions-dialog table-list-dialog",
        events: {
            'click a.intercept-navigation': 'selected',
            'click a.interaction-action': 'interactionActionClick'
        },
        render: function() {
            var render = this._render.bind(this);
            getFormsPromise().done(render);
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
                return s.localizeFrom('resources', entry.attr('label'));
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
            if (ttResourceKey !== '') {
                var tt = s.localizeFrom('resources', ttResourceKey);
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
                var tblId = isRsAction ? 1 : 52;
                var recordSets = new schema.models.RecordSet.LazyCollection({
                    filters: { specifyuser: userInfo.id, type: 0, dbtableid: tblId,
                               domainfilter: true, orderby: '-timestampcreated' }
                });
                recordSets.fetch({ limit: 5000 }).done(function() {
                    new InteractionDialog({ recordSets: recordSets, action: action, readOnly: true, close: !isRsAction }).render();
                });
            } else if (action.attr('action') == 'PRINT_INVOICE') {
                //assuming loan invoice for now (52 is loan tableid)
                reports({
                    tblId: 52,
                    metaDataFilter:  {prop: 'reporttype', val: 'invoice'},
                    autoSelectSingle: true
                });
            } else {
                alert(action.attr('action') + " action is not supported.");
            }
        }
    });

