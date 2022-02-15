"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';


import {ajax} from './ajax';
import {schema, getModel} from './schema';
import {getIcon} from './icons';
import specifyform from './specifyform';
import {userInformation} from './userinfo';
import InteractionDialog from './interactiondialog';
import * as s from './stringlocalization';
import reports from './reports';
import formsText from './localization/forms';
import commonText from './localization/common';
import {makeResourceViewUrl} from "./specifyapi";
import {SpecifyModel} from "./specifymodel";
import {
  dialogClassNames,
  LoadingView,
  showDialog
} from "./components/modaldialog";

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
        events: {
            'click a.interaction-action': 'interactionActionClick'
        },
        render: function() {
            const loadingDialog = isFulfilled
              ? undefined
              : new LoadingView().render();
            getFormsPromise.then(fetchedForms=>{
                loadingDialog?.remove();
                this._render(fetchedForms);
            });
            return this;
        },
        _render: function(forms) {
            if(typeof this.options.urlParameter === 'undefined'){
                let formIndex = -1;
                this.el.innerHTML = `<ul role="list">
                    ${interaction_entries
                        .map((entry)=>{
                            if(!isActionEntry(entry))
                              formIndex+=1;
                            return this.dialogEntry(forms, entry, formIndex);
                        })
                        .join('')}
                </ul>`;

                this.dialog?.remove();
                this.dialog = showDialog({
                    header: commonText('interactions'),
                    content: this.el,
                    className: {
                        container: dialogClassNames.narrowContainer
                    },
                    onClose: () => {
                        this.dialog.remove();
                        this.options.onClose?.();
                    },
                    buttons: commonText('close')
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
                return getModel(entry.attr('table')).label;
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
              href = makeResourceViewUrl(SpecifyModel.parseClassName(form['class']));
              className = 'intercept-navigation';
            }

            return `<li
                title="${this.getDialogEntryTooltip(interactionEntry)}"
                aria-label="${this.getDialogEntryTooltip(interactionEntry)}"
            >
                <a
                    class="${className} link"
                    href="${href}"
                >
                    <img
                        alt="${interactionEntry.attr('icon')}"
                        src="${getIcon(interactionEntry.attr('icon'))}"
                        aria-hidden="true"
                        class="w-table-icon"
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
            this.dialog.remove();
            this.handleAction(actions[index]);
        },
        handleAction(action){
            var isRsAction = this.isRsAction(action.attr('action'));
            if (isRsAction || action.attr('action') == 'RET_LOAN') {
                var tblId = isRsAction ? 1 : 52;
                var recordSets = new schema.models.RecordSet.LazyCollection({
                    filters: { specifyuser: userInformation.id, type: 0, dbtableid: tblId,
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

