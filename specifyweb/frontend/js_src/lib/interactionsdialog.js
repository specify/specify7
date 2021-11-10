"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('q');


var schema            = require('./schema.js');
var icons             = require('./icons.js');
var specifyform       = require('./specifyform.js');
var initialContext    = require('./initialcontext.js');
var userInfo          = require('./userinfo').default;
var InteractionDialog = require('./interactiondialog.js');
var s                 = require('./stringlocalization.js');
var reports           = require('./reports.js');
const formsText = require('./localization/forms').default;
const commonText = require('./localization/common').default;

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


module.exports = Backbone.View.extend({
        __name__: "InteractionsDialog",
        tagName: 'nav',
        className: "interactions-dialog",
        events: {
            'click button.interaction-action': 'interactionActionClick'
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
        _render: function(forms) {
            this.forms = forms;
            let formIndex = -1;
            this.el.innerHTML = `<ul style="padding: 0">
                ${interaction_entries
                    .map((entry)=>{
                        if(!isActionEntry(entry))
                          formIndex+=1;
                        return this.dialogEntry(entry, formIndex);
                    })
                    .join('')}
            </ul>`;

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
        getDialogEntryTooltip: function(entry) {
            const ttResourceKey = entry.attr('tooltip');
            if (ttResourceKey !== '')
                return s.localizeFrom('resources', ttResourceKey) || '';
            return '';
        },
        dialogEntry: function(interactionEntry, formIndex) {
            let tagName = 'button';
            let className = 'interaction-action';
            let attributes = 'type="button"';

            if(!isActionEntry(interactionEntry)){
              const form = this.forms[formIndex];
              const model = schema.getModel(form['class'].split('.').pop());
              const href = new model.Resource().viewUrl();

              attributes = `href="${href}"`;
              tagName = 'a';
              className = 'intercept-navigation';
            }

            return `<li
                title="${this.getDialogEntryTooltip(interactionEntry)}"
            >
                <${tagName}
                    class="${className} fake-link"
                    style="font-size: 0.8rem"
                    ${attributes}
                >
                    <img
                        alt="${interactionEntry.attr('icon')}"
                        src="${icons.getIcon(interactionEntry.attr('icon'))}"
                        style="width: var(--table-icon-size)"
                        aria-hidden="true"
                    > 
                    ${this.getDialogEntryText(interactionEntry)}
                </${tagName}>
            </li>`;
        },
        selected: function(evt) {
            var index = this.$('button').filter(".intercept-navigation").index(evt.currentTarget);
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
            var index = this.$('button').filter(".interaction-action").index(evt.currentTarget);
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

