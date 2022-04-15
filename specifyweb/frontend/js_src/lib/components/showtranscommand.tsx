import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { RA } from '../types';
import { sortObjectsByKey } from '../helpers';
import { f } from '../functools';
import { H3, Link, Ul } from './basic';
import { useAsyncState } from './hooks';
import { Dialog } from './modaldialog';
import { hasTablePermission } from '../permissions';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import { deserializeResource } from './resource';

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
    React.useCallback(
      async () =>
        f.all({
          openLoans: hasTablePermission('LoanPreparation', 'read')
            ? fetchCollection(
                'LoanPreparation',
                {
                  isResolved: false,
                  limit: DEFAULT_FETCH_LIMIT,
                },
                {
                  preparation_id: resource.get('id'),
                }
              ).then(({ records }) => records.map(deserializeResource))
            : undefined,
          resolvedLoans: hasTablePermission('LoanPreparation', 'read')
            ? fetchCollection(
                'LoanPreparation',
                {
                  isResolved: true,
                  limit: DEFAULT_FETCH_LIMIT,
                },
                {
                  preparation_id: resource.get('id'),
                }
              ).then(({ records }) => records.map(deserializeResource))
            : undefined,
          gifts: hasTablePermission('GiftPreparation', 'read')
            ? fetchCollection(
                'GiftPreparation',
                { limit: DEFAULT_FETCH_LIMIT },
                {
                  preparation_id: resource.get('id'),
                }
              ).then(({ records }) => records.map(deserializeResource))
            : undefined,
          exchanges: hasTablePermission('GiftPreparation', 'read')
            ? fetchCollection(
                'GiftPreparation',
                { limit: DEFAULT_FETCH_LIMIT },
                {
                  preparation_id: resource.get('id'),
                }
              ).then(({ records }) => records.map(deserializeResource))
            : undefined,
        }),
      [resource]
    ),
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
          <H3>{formsText('exchanges')}</H3>
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
