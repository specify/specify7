"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import { schema } from './schema';
import {fieldFormat} from './fieldformat';
import { userInformation } from './userinfo';
import * as s from './stringlocalization';
import formsText from './localization/forms';
import commonText from './localization/common';
import {getDateInputValue} from './dayjs';
import {className} from './components/basic';
import {legacyNonJsxIcons} from "./components/icons";

function formatCatNo(catNo) {
    const field = schema.models.CollectionObject.getField('catalognumber');
    return fieldFormat(field, catNo);
}

function localize(key, fallback) {
    return s.localizeFrom('resources', key, fallback);
}

const PrepReturnRow = Backbone.View.extend({
    __name__: "PrepReturnRow",
    tagName: 'tr',
    events: {
        'change .return-amt': 'returnAmountChanged',
        'change .resolve-amt': 'resolveAmountChanged',
        'change :checkbox': 'checkChanged',
        'click a.return-remark': 'toggleRemarks'
    },
    initialize({ loanpreparation }) {
        this.loanpreparation = loanpreparation;
        this.unresolved = loanpreparation.get('quantity') - loanpreparation.get('quantityresolved');
    },
    render() {
        const lp = this.loanpreparation;
        const unresolved = this.unresolved;

        this.$el.append(`
            <td>
                <input
                    type="checkbox"
                    title="${formsText('selectAll')}"
                    aria-label="${formsText('selectAll')}"
                >
            </td>
            <td class="return-catnum">
            <td class="return-taxon">
            <td class="return-prep-type text-center">
            <td class="text-center">${unresolved}</td>
            <td>
                <input
                    type="number"
                    value="0"
                    min="0"
                    max="${unresolved}"
                    class="return-amt w-12"
                    title="${formsText('returnedAmount')}"
                    aria-label="${formsText('returnedAmount')}"
                >
            </td>
            <td>
                <input
                    type="number"
                    value="0"
                    min="0"
                    max="${unresolved}"
                    class="resolve-amt w-12"
                    title="${formsText('resolvedAmount')}"
                    aria-label="${formsText('resolvedAmount')}"
                >
            </td>
            <td>
                <button
                    type="button"
                    class="return-remark icon w-full"
                    style="display:none"
                    title="${formsText('remarks')}"
                    aria-label=${formsText('remarks')}
                >
                    ${legacyNonJsxIcons.annotation}
                </button>
            </td>
        `);

        $.when(
            lp.rget('preparation.collectionobject', true),
            lp.rget('preparation.preptype', true)
        ).then(
            (co, pt) => {
                if (co) {
                    co.rget('determinations').pipe(dets => {
                        const det = dets.filter(d => d.get('iscurrent'))[0];
                        return det == null ? null : det.rget('preferredtaxon', true);
                    }).then(taxon => {
                        this.$('.return-catnum').text(formatCatNo(co.get('catalognumber')));
                        this.$('.return-taxon').text(taxon == null ? "" : taxon.get('fullname'));
                        this.$('.return-prep-type').text(pt.get('name'));
                    });
                } else {
                    var desc = lp.get('descriptionofmaterial') ?
                            lp.get('descriptionofmaterial').substr(0,50) :
                            "uncataloged";
                    this.$('.return-taxon').text(desc);
                }
            }
        );

        return this;
    },
    returnAmountChanged() {
        const returnUI = this.$(".return-amt");
        const resolveUI = this.$(".resolve-amt");
        // make return <= unresolved
        returnUI.val(Math.min(returnUI.val(), this.unresolved));
        // make resolved >= returned
        resolveUI.val(Math.max(resolveUI.val(), returnUI.val()));
        this.updateCheckbox();
        this.showHideRemarks();
    },
    resolveAmountChanged(evt) {
        const returnUI = this.$(".return-amt");
        const resolveUI = this.$(".resolve-amt");
        // make resolve <= unresolved
        resolveUI.val(Math.min(resolveUI.val(), this.unresolved));
        // make returned <= resolved
        returnUI.val(Math.min(returnUI.val(), $(evt.currentTarget).val()));
        this.updateCheckbox();
        this.showHideRemarks();
    },
    checkChanged() {
        const value = this.$(':checkbox').prop('checked') ? this.unresolved : 0;
        this.$(".return-amt").val(value);
        this.$(".resolve-amt").val(value);
        this.showHideRemarks();
    },
    updateCheckbox() {
        this.$(':checkbox').prop('checked', this.$(".resolve-amt").val() > 0);
    },
    showHideRemarks() {
        const action = this.$(".resolve-amt").val() > 0 ? "show" : "hide";
        this.$(".return-remark")[action]();
        action == 'hide' && this.$el.closest('tr').next().hide();
    },
    toggleRemarks() {
        const remarks = this.$el.closest('tr').next();
        remarks.toggle();
        $('input', remarks).focus(); // no effect if not visible, right?
    },
    doResolve(dummyLRP) {
        const lp = this.loanpreparation;

        const resolved = parseInt(this.$(".resolve-amt").val(), 10);
        if (resolved < 1) return;

        const returned = parseInt(this.$(".return-amt").val(), 10);

        var remarks = this.$el.closest('tr').next().find("input").val().trim();
        remarks === "" && (remarks = null);

        lp.set({
            quantityreturned: lp.get('quantityreturned') + returned,
            quantityresolved: lp.get('quantityresolved') + resolved
        });

        lp.set('isresolved', lp.get('quantityresolved') >= lp.get('quantity'));

        const lrp = new schema.models.LoanReturnPreparation.Resource({
            loanpreparation: lp.url(),
            remarks: remarks,
            quantityresolved: resolved,
            quantityreturned: returned,
            receivedby: dummyLRP.get('receivedby'),
            returneddate: dummyLRP.get('returneddate')
        });

        lp.dependentResources.loanreturnpreparations.models.push(lrp);
        lp.dependentResources.loanreturnpreparations.length += 1;
        lp.dependentResources.loanreturnpreparations.trigger('add');
    }
});


const METADATAFORM = `
<table data-specify-model="LoanReturnPreparation">
  <tr>
    <td class="${className.formLabel}"><label for="lrp-receivedby"></label></td>
    <td>
      <input
        type="text"
        class="specify-querycbx specify-field"
        name="receivedBy"
        id="lrp-receivedby"
        data-specify-initialize="name=Agent"
        title="${formsText('receivedBy')}"  
        aria-label="${formsText('receivedBy')}"  
      >
    </td>
    <td class="${className.formLabel}"><label for="lrp-date"></label></td>
    <td>
      <input
        type="text"
        class="specify-formattedtext specify-field"
        name="returnedDate"
        id="lrp-date"
        title="${formsText('dateResolved')}"  
        aria-label="${formsText('dateResolved')}"  
      >
    </td>
  </tr>
</table>
`;

const REMARKSROW = `<tr class="return-remark" style="display:none">
  <td></td>
  <td colspan="6">
    <input
      type="text"
      class="return-remark"
      placeholder="${formsText('remarks')}"
      title="${formsText('remarks')}" 
      aria-label="${formsText('remarks')}"  
    >
  </td>
</tr>`;

export default Backbone.View.extend({
    __name__: "PrepReturnDialog",
    initialize({populateForm, loanpreparations}) {
        this.populateForm = populateForm;
        this.loanpreparations = loanpreparations;

        this.dummyLRP = null;
        this.prepReturnRows = null;
    },
    render: function() {
        const form = $(METADATAFORM);
        this.$el.append(form, '<hr class="border-gray-500 w-full">');

        // this is used to capture the receiving agent and date
        this.dummyLRP = new schema.models.LoanReturnPreparation.Resource({
            returneddate: getDateInputValue(new Date()),
            receivedby: userInformation.agent.resource_uri
        });
        this.populateForm(form, this.dummyLRP);

        this.prepReturnRows = this.loanpreparations.map(lp => new PrepReturnRow({ loanpreparation: lp }));

        this.$el.append(
            $('<table>').append(`
                <tr>
                    <td></td>
                    <th scope="col" class="text-center">${schema.models.CollectionObject.getField('catalognumber').label}</th>
                    <th scope="col" class="text-center">${schema.models.Determination.getField('taxon').label}</th>
                    <th scope="col" class="text-center">${schema.models.Preparation.getField('preptype').label}</th>
                    <th scope="col" class="text-center">${formsText('unresolved')}</th>
                    <th scope="col" class="text-center">${formsText('return')}</th>
                    <th scope="col" class="text-center" colspan="2">${formsText('resolve')}</th>
                </tr>`
            )
        ).append(
            this.prepReturnRows.flatMap(row => [row.render().$el, REMARKSROW])
        );

        const buttons = (this.options.readOnly ? [] : [
            {
                text: localize('SELECTALL'),
                click: _.bind(this.selectAll, this),
                title: formsText('returnAllPreparations')
            },
            {
                text: localize('DESELECTALL'),
                click: _.bind(this.deSelectAll, this),
                title: commonText('clearAll'),
            },
            {
                text: commonText('apply'),
                click: _.bind(this.returnSelections, this),
                title: formsText('returnSelectedPreparations')
            }
        ]).concat({
            text: localize('CANCEL'),
            click: function() { $(this).dialog('close'); }
        });

        this.$el.dialog({
            modal: true,
            close: function() { $(this).remove(); },
            title: schema.models.LoanPreparation.label,
            maxHeight: 700,
            width: 600,
            buttons: buttons
        });
        return this;
    },
    returnSelections: function() {
        this.prepReturnRows.forEach(row => row.doResolve(this.dummyLRP));
        this.$el.dialog('close');
    },
    selectAll: function() {
        this.$(':checkbox').prop('checked', true).change();
    },
    deSelectAll: function() {
        this.$(':checkbox').prop('checked', false).change();
    }
});

