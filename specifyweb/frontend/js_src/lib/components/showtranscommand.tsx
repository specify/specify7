import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { schema } from '../schema';
import type { RA } from '../types';
import { sortObjectsByKey } from '../wbplanviewhelper';
import { Link, Ul } from './basic';
import { useAsyncState } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';

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
    )
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
}): JSX.Element {
  const [data] = useAsyncState(
    React.useCallback(async () => {
      const openLoanPreps = new schema.models.LoanPreparation.LazyCollection({
        filters: { preparation_id: resource.get('id'), isresolved: false },
      });
      const resolvedLoanPreps =
        new schema.models.LoanPreparation.LazyCollection({
          filters: { preparation_id: resource.get('id'), isresolved: true },
        });
      const giftPreps = new schema.models.GiftPreparation.LazyCollection({
        filters: { preparation_id: resource.get('id') },
      });
      const exchPreps = new schema.models.ExchangeOutPrep.LazyCollection({
        filters: { preparation_id: resource.get('id') },
      });
      return Promise.all([
        openLoanPreps.fetchPromise(),
        resolvedLoanPreps.fetchPromise(),
        giftPreps.fetchPromise(),
        exchPreps.fetchPromise(),
      ]).then(([openLoans, resolvedLoans, gifts, exchanges]) => ({
        openLoans: openLoans.models,
        resolvedLoans: resolvedLoans.models,
        gifts: gifts.models,
        exchanges: exchanges.models,
      }));
    }, [resource])
  );

  return typeof data === 'object' ? (
    <Dialog
      buttons={commonText('close')}
      header={commonText('transactions')}
      onClose={handleClose}
    >
      <h2>{formsText('openLoans')}</h2>
      <List
        resources={data.openLoans}
        fieldName="loan"
        displayFieldName="loanNumber"
      />
      <h2>{formsText('resolvedLoans')}</h2>
      <List
        resources={data.resolvedLoans}
        fieldName="loan"
        displayFieldName="loanNumber"
      />
      <h2>{formsText('gifts')}</h2>
      <List
        resources={data.gifts}
        fieldName="gift"
        displayFieldName="giftNumber"
      />
      {data.exchanges.length > 0 && (
        <>
          <h2>${formsText('exchanges')}</h2>
          <List
            resources={data.exchanges}
            fieldName="exchange"
            displayFieldName="exchangeOutNumber"
          />
        </>
      )}
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}
