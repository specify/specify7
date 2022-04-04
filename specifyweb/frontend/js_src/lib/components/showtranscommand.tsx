import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { schema } from '../schema';
import type { RA } from '../types';
import { sortObjectsByKey } from '../helpers';
import { f } from '../functools';
import { H3, Link, Ul } from './basic';
import { useAsyncState } from './hooks';
import { Dialog } from './modaldialog';
import { hasTablePermission } from '../permissions';

function List({
  resources,
  fieldName,
  displayFieldName,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
  readonly fieldName: string;
  readonly displayFieldName: string;
}): JSX.Element {
  const [entries] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          resources.map((resource) => resource.rgetPromise(fieldName))
        ).then((resources: RA<SpecifyResource<AnySchema>>) =>
          sortObjectsByKey(
            resources.map((resource) => ({
              label: resource.get(displayFieldName),
              href: resource.viewUrl(),
            })),
            'label'
          )
        ),
      [resources, fieldName, displayFieldName]
    ),
    false
  );

  return resources.length === 0 ? (
    <>{commonText('nullInline')}</>
  ) : Array.isArray(entries) ? (
    <Ul>
      {entries.map(({ label, href }, index) => (
        <li key={index}>
          <Link.NewTab href={href}>{label}</Link.NewTab>
        </li>
      ))}
    </Ul>
  ) : (
    <>{commonText('loading')}</>
  );
}

export function ShowLoansCommand({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(async () => {
      const openLoanPreps = hasTablePermission('LoanPreparation', 'read')
        ? new schema.models.LoanPreparation.LazyCollection({
            filters: { preparation_id: resource.get('id'), isresolved: false },
          })
        : undefined;
      const resolvedLoanPreps = hasTablePermission('LoanPreparation', 'read')
        ? new schema.models.LoanPreparation.LazyCollection({
            filters: { preparation_id: resource.get('id'), isresolved: true },
          })
        : undefined;
      const giftPreps = hasTablePermission('GiftPreparation', 'read')
        ? new schema.models.GiftPreparation.LazyCollection({
            filters: { preparation_id: resource.get('id') },
          })
        : undefined;
      const exchPreps = hasTablePermission('ExchangeOutPrep', 'read')
        ? new schema.models.ExchangeOutPrep.LazyCollection({
            filters: { preparation_id: resource.get('id') },
          })
        : undefined;
      return f
        .all({
          openLoans: openLoanPreps?.fetchPromise(),
          resolvedLoans: resolvedLoanPreps?.fetchPromise(),
          gifts: giftPreps?.fetchPromise(),
          exchanges: exchPreps?.fetchPromise(),
        })
        .then(({ openLoans, resolvedLoans, gifts, exchanges }) => ({
          openLoans: openLoans?.models,
          resolvedLoans: resolvedLoans?.models,
          gifts: gifts?.models,
          exchanges: exchanges?.models,
        }));
    }, [resource]),
    true
  );

  return typeof data === 'object' ? (
    <Dialog
      buttons={commonText('close')}
      header={commonText('transactions')}
      onClose={handleClose}
    >
      <H3>{formsText('openLoans')}</H3>
      <List
        resources={data.openLoans ?? []}
        fieldName="loan"
        displayFieldName="loanNumber"
      />
      <H3>{formsText('resolvedLoans')}</H3>
      <List
        resources={data.resolvedLoans ?? []}
        fieldName="loan"
        displayFieldName="loanNumber"
      />
      <H3>{formsText('gifts')}</H3>
      <List
        resources={data.gifts ?? []}
        fieldName="gift"
        displayFieldName="giftNumber"
      />
      {Array.isArray(data.exchanges) && data.exchanges.length > 0 && (
        <>
          <H3>${formsText('exchanges')}</H3>
          <List
            resources={data.exchanges}
            fieldName="exchange"
            displayFieldName="exchangeOutNumber"
          />
        </>
      )}
    </Dialog>
  ) : null;
}
