"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';


import ajax from './ajax';
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

    var interaction_entries, actions, isFulfilled=false;

    const getFormsPromise = ajax(
        '/context/app.resource?name=InteractionsTaskInit',
        {headers: {Accept: 'application/xml'}}
    ).then(({data}) => {
        interaction_entries = _.map($('entry', data), $)
            .filter(entry => entry.attr('isonleft') === 'true'
                    && !['NEW_DISPOSAL', 'NEW_EXCHANGE_OUT', 'LN_NO_PRP', 'Specify Info Request'].includes(entry.attr('action')));

        const views = interaction_entries.filter(entry => !isActionEntry(entry));
        actions = interaction_entries.filter(isActionEntry);

        actions.forEach(actionEntry => actionEntry.table = getTableForObjToCreate(actionEntry));

        return Q.all(views.map(
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
        tagName: 'nav',
        className: "interactions-dialog",
        events: {
            'click a.interaction-action': 'interactionActionClick'
        },
        render: function() {
            let loadingDialog = undefined;
            if(!isFulfilled){
                loadingDialog = $(
                    '<div><div class="progress-bar"></div></div>'
                ).dialog({
                    title: commonText('loading'),
                    modal: true,
                    dialogClass: 'ui-dialog-no-close',
                });
                $('.progress-bar', loadingDialog).progressbar({value: false});
            }
            getFormsPromise.then(fetchedForms=>{
                isFulfilled=true;
                loadingDialog?.dialog('destroy');
                this._render(fetchedForms);
            });
            return this;
        },
        _render: function(forms) {
            if(typeof this.options.urlParameter === 'undefined'){
                let formIndex = -1;
                this.el.innerHTML = `<ul style="padding: 0">
                    ${interaction_entries
                        .map((entry)=>{
                            if(!isActionEntry(entry))
                              formIndex+=1;
                            return this.dialogEntry(forms, entry, formIndex);
                        })
                        .join('')}
                </ul>`;

                this.$el.dialog({
                    title: commonText('interactions'),
                    maxHeight: 400,
                    modal: true,
                    close: this.options.onClose,
                    buttons: [{
                        text: commonText('close'),
                        click: function() { $(this).dialog('close'); }
                    }]
                });
            } else {
                const action = interaction_entries
                    .find(a=>a[0].getAttribute('action')===this.options.urlParameter);
                this.handleAction(action);
            }
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
        getDialogEntryTooltip: function(entry) {
            const ttResourceKey = entry.attr('tooltip');
            if (ttResourceKey !== '')
                return s.localizeFrom('resources', ttResourceKey) || '';
            return '';
        },
        dialogEntry: function(forms, interactionEntry, formIndex) {
            let className = 'interaction-action';
            let href='';

            if(isActionEntry(interactionEntry)) {
                const action = interactionEntry[0].getAttribute('action');
                href = `/specify/task/interactions/${action}`;
            }
            else {
              const form = forms[formIndex];
              const model = schema.getModel(form['class'].split('.').pop());

              href = new model.Resource().viewUrl();
              className = 'intercept-navigation';
            }

            return `<li
                title="${this.getDialogEntryTooltip(interactionEntry)}"
                aria-label="${this.getDialogEntryTooltip(interactionEntry)}"
            >
                <a
                    class="${className} fake-link"
                    style="font-size: 0.8rem"
                    href="${href}"
                >
                    <img
                        alt="${interactionEntry.attr('icon')}"
                        src="${getIcon(interactionEntry.attr('icon'))}"
                        style="width: var(--table-icon-size)"
                        aria-hidden="true"
                    >
                    ${this.getDialogEntryText(interactionEntry)}
                </a>
            </li>`;
        },
        isRsAction: function(actionName) {
            return actionName == 'NEW_GIFT' || actionName == 'NEW_LOAN';
        },
        interactionActionClick(event) {
            event.preventDefault();
            const index = this.$('a').filter(".interaction-action").index(event.currentTarget);
            this.$el.dialog('close');
            this.handleAction(actions[index]);
        },
        handleAction(action){
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
                }).then(view=>view.render());
            } else {
                alert(formsText('actionNotSupported')(action.attr('action')));
            }
        }
    });

