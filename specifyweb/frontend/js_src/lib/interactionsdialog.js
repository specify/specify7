"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';


import schema from './schema';
import { getIcon } from './icons';
import specifyform from './specifyform';
import * as initialContext from './initialcontext';
import userInfo from './userinfo';
import InteractionDialog from './interactiondialog';
import * as s from './stringlocalization';
import reports from './reports';
import formsText from './localization/forms';
import commonText from './localization/common';

    var interaction_entries, views, actions, forms, getFormsPromise;

    initialContext.load('app.resource?name=InteractionsTaskInit', function (data) {
        interaction_entries = _.map($('entry', data), $)
            .filter(entry => entry.attr('isonleft') === 'true'
                    && !['NEW_DISPOSAL', 'NEW_EXCHANGE_OUT', 'LN_NO_PRP', 'Specify Info Request'].includes(entry.attr('action')));

        views = interaction_entries.filter(entry => !isActionEntry(entry));
        actions = interaction_entries.filter(isActionEntry);

        actions.forEach(actionEntry => actionEntry.table = getTableForObjToCreate(actionEntry));

        getFormsPromise = Q.all(views.map(
          view => Q(specifyform.getView(view.attr('view'))).then(form => form)
        ));
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
        return actionAttr && actionAttr != 'OpenNewView' && actionAttr != 'NEW_ACC';
    }


export default Backbone.View.extend({
        __name__: "InteractionsDialog",
        className: "interactions-dialog table-list-dialog",
        events: {
            'click a.intercept-navigation': 'selected',
            'click a.interaction-action': 'interactionActionClick'
        },
        render: function() {
            if(getFormsPromise.isFulfilled()) {
                this._render();
            } else {
              const loadingDialog = $(
                  '<div><div class="progress-bar"></div></div>'
              ).dialog({
                  title: commonText('loading'),
                  modal: true,
                  dialogClass: 'ui-dialog-no-close',
              });
              $('.progress-bar', loadingDialog).progressbar({ value: false });
              getFormsPromise.done(fetchedForms=>{
                loadingDialog.dialog('destroy');
                this._render();
              });
            }
            return this;
        },
        _render: function() {
            var entries = _.map(interaction_entries, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: commonText('interactions'),
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{
                    text: commonText('close'),
                    click: function() { $(this).dialog('close'); }
                }]
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
            var img = $('<img>', { src: getIcon(interaction_entry.attr('icon')) });
            var link = isActionEntry(interaction_entry) ?
                    $('<a>').addClass("interaction-action").text(this.getDialogEntryText(interaction_entry)) :
                    $('<a>').addClass("intercept-navigation").text(this.getDialogEntryText(interaction_entry));
            this.addDialogEntryToolTip(interaction_entry, link);
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        },
        selected: function(evt) {
            var index = this.$('a').filter(".intercept-navigation").index(evt.currentTarget);
            getFormsPromise.done(forms => {
                this.$el.dialog('close');
                var form = forms[index];
                var model = schema.getModel(form['class'].split('.').pop());
                this.trigger('selected', model);
            });
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
                    //metaDataFilter:  {prop: 'reporttype', val: 'invoice'},
                    autoSelectSingle: true
                });
            } else {
                alert(formsText('actionNotSupported')(action.attr('action')));
            }
        }
    });

