'use strict';

import $ from 'jquery';
import React from 'react';

import Backbone from '../backbone';
import type { Loan, LoanPreparation } from '../datamodel';
import { getDateInputValue } from '../dayjs';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { schema } from '../schema';
import * as s from '../stringlocalization';
import type { RA } from '../types';
import { defined } from '../types';
import { fieldFormat } from '../uiparse';
import { userInformation } from '../userinfo';
import { Button, className } from './basic';
import { useAsyncState } from './hooks';
import { legacyNonJsxIcons } from './icons';
import { Dialog, LoadingScreen } from './modaldialog';

function formatCatNo(catNo) {
  const field = schema.models.CollectionObject.getLiteralField('catalognumber');
  return fieldFormat(field, undefined, catNo);
}

const localize = <T extends string | undefined>(key: string, fallback?: T): T =>
  s.localizeFrom('resources', key, fallback) as T;

const PrepReturnRow = Backbone.View.extend({
  __name__: 'PrepReturnRow',
  tagName: 'tr',
  events: {
    'change .return-amt': 'returnAmountChanged',
    'change .resolve-amt': 'resolveAmountChanged',
    'change :checkbox': 'checkChanged',
    'click a.return-remark': 'toggleRemarks',
  },
  initialize({ loanpreparation }) {
    this.loanpreparation = loanpreparation;
    this.unresolved =
      loanpreparation.get('quantity') - loanpreparation.get('quantityresolved');
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
    ).then((co, pt) => {
      if (co) {
        co.rget('determinations')
          .pipe((dets) => {
            const det = dets.find((d) => d.get('iscurrent'));
            return det == null ? null : det.rget('preferredtaxon', true);
          })
          .then((taxon) => {
            this.$('.return-catnum').text(formatCatNo(co.get('catalognumber')));
            this.$('.return-taxon').text(
              taxon == null ? '' : taxon.get('fullname')
            );
            this.$('.return-prep-type').text(pt.get('name'));
          });
      } else {
        const desc = lp.get('descriptionofmaterial')
          ? lp.get('descriptionofmaterial').slice(0, 50)
          : 'uncataloged';
        this.$('.return-taxon').text(desc);
      }
    });

    return this;
  },
  returnAmountChanged() {
    const returnUI = this.$('.return-amt');
    const resolveUI = this.$('.resolve-amt');
    // Make return <= unresolved
    returnUI.val(Math.min(returnUI.val(), this.unresolved));
    // Make resolved >= returned
    resolveUI.val(Math.max(resolveUI.val(), returnUI.val()));
    this.updateCheckbox();
    this.showHideRemarks();
  },
  resolveAmountChanged(event_) {
    const returnUI = this.$('.return-amt');
    const resolveUI = this.$('.resolve-amt');
    // Make resolve <= unresolved
    resolveUI.val(Math.min(resolveUI.val(), this.unresolved));
    // Make returned <= resolved
    returnUI.val(Math.min(returnUI.val(), $(event_.currentTarget).val()));
    this.updateCheckbox();
    this.showHideRemarks();
  },
  checkChanged() {
    const value = this.$(':checkbox').prop('checked') ? this.unresolved : 0;
    this.$('.return-amt').val(value);
    this.$('.resolve-amt').val(value);
    this.showHideRemarks();
  },
  updateCheckbox() {
    this.$(':checkbox').prop('checked', this.$('.resolve-amt').val() > 0);
  },
  showHideRemarks() {
    const action = this.$('.resolve-amt').val() > 0 ? 'show' : 'hide';
    this.$('.return-remark')[action]();
    action == 'hide' && this.$el.closest('tr').next().hide();
  },
  toggleRemarks() {
    const remarks = this.$el.closest('tr').next();
    remarks.toggle();
    $('input', remarks).focus(); // No effect if not visible, right?
  },
  doResolve(dummyLRP) {
    const lp = this.loanpreparation;

    const resolved = Number.parseInt(this.$('.resolve-amt').val(), 10);
    if (resolved < 1) return;

    const returned = Number.parseInt(this.$('.return-amt').val(), 10);

    let remarks = this.$el.closest('tr').next().find('input').val().trim();
    remarks === '' && (remarks = null);

    lp.set({
      quantityreturned: lp.get('quantityreturned') + returned,
      quantityresolved: lp.get('quantityresolved') + resolved,
    });

    lp.set('isresolved', lp.get('quantityresolved') >= lp.get('quantity'));

    const lrp = new schema.models.LoanReturnPreparation.Resource({
      loanpreparation: lp.url(),
      remarks,
      quantityresolved: resolved,
      quantityreturned: returned,
      receivedby: dummyLRP.get('receivedby'),
      returneddate: dummyLRP.get('returneddate'),
    });

    lp.dependentResources.loanreturnpreparations.models.push(lrp);
    lp.dependentResources.loanreturnpreparations.length += 1;
    lp.dependentResources.loanreturnpreparations.trigger('add');
  },
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
  render() {
    this.dummyLRP = null;
    this.prepReturnRows = null;

    const form = $(METADATAFORM);
    this.$el.append(form, '<hr class="border-gray-500 w-full">');

    // This is used to capture the receiving agent and date
    this.dummyLRP = new schema.models.LoanReturnPreparation.Resource({
      returneddate: getDateInputValue(new Date()),
      receivedby: userInformation.agent.resource_uri,
    });
    this.populateForm(form, this.dummyLRP);

    this.prepReturnRows = this.loanpreparations.map(
      (lp) => new PrepReturnRow({ loanpreparation: lp })
    );

    this.$el.append(
      this.prepReturnRows.flatMap((row) => [row.render().$el, REMARKSROW])
    );
  },
  returnSelections() {
    this.prepReturnRows.forEach((row) => row.doResolve(this.dummyLRP));
    this.$el.dialog('close');
  },
  selectAll() {
    this.$(':checkbox').prop('checked', true).change();
  },
  deSelectAll() {
    this.$(':checkbox').prop('checked', false).change();
  },
});

function PreparationReturn({
  preparations,
  onClose: handleClose,
}: {
  readonly preparations: RA<SpecifyResource<LoanPreparation>>;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={schema.models.LoanPreparation.label}
      onClose={handleClose}
      buttons={
        <>
          <Button.Green
            onClick={'selectAll'}
            title={formsText('returnAllPreparations')}
          >
            {localize('SELECTALL')}
          </Button.Green>
          <Button.Green onClick={'deSelectAll'} title={commonText('clearAll')}>
            {localize('DESELECTALL')}
          </Button.Green>
          <Button.Green
            onClick={'returnSelections'}
            title={formsText('returnSelectedPreparations')}
          >
            {commonText('apply')}
          </Button.Green>
        </>
      }
    >
      <table>
        <thead>
          <tr>
            <td />
            <th scope="col" className="text-center">
              {
                defined(
                  schema.models.CollectionObject.getField('catalogNumber')
                ).label
              }
            </th>
            <th scope="col" className="text-center">
              {defined(schema.models.Determination.getField('taxon')).label}
            </th>
            <th scope="col" className="text-center">
              {defined(schema.models.Preparation.getField('prepType')).label}
            </th>
            <th scope="col" className="text-center">
              {formsText('unresolved')}
            </th>
            <th scope="col" className="text-center">
              {formsText('return')}
            </th>
            <th scope="col" className="text-center" colSpan={2}>
              {formsText('resolve')}
            </th>
          </tr>
        </thead>
      </table>
    </Dialog>
  );
}

export function LoanReturn({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<Loan>;
  readonly onClose: () => void;
}): JSX.Element {
  const [preparations] = useAsyncState(
    React.useCallback(
      async () =>
        resource
          .rgetCollection('loanPreparations', true)
          .then(({ models }) =>
            models.filter(
              (preparation) =>
                (preparation.get('quantity') ?? 0) >
                (preparation.get('quantityResolved') ?? 0)
            )
          ),
      [resource]
    )
  );

  return Array.isArray(preparations) ? (
    preparations.length === 0 ? (
      <Dialog
        header={schema.models.LoanPreparation.label}
        onClose={handleClose}
        buttons={commonText('close')}
      >
        {formsText('noUnresolvedPreparations')}
      </Dialog>
    ) : (
      <PreparationReturn preparations={preparations} onClose={handleClose} />
    )
  ) : (
    <LoadingScreen />
  );
}
