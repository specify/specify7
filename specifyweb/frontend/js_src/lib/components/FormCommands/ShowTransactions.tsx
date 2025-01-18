import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { Preparation } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { ResourceLink } from '../Molecules/ResourceLink';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';

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
    React.useCallback(async () => {
      const interactions: RA<SpecifyResource<AnySchema>> = await Promise.all(
        resources.map(async (resource) => resource.rgetPromise(fieldName))
      );
      return interactions
        .map((resource) => ({
          label: resource.get(displayFieldName),
          resource,
        }))
        .sort(sortFunction(({ label }) => label));
    }, [resources, fieldName, displayFieldName]),
    false
  );

  return resources.length === 0 ? (
    <>{commonText.noResults()}</>
  ) : Array.isArray(entries) ? (
    <Ul>
      {entries.map(({ label, resource }, index) => (
        <li key={index}>
          <ResourceLink
            component={Link.Default}
            props={{}}
            resource={resource}
            resourceView={{ onDeleted: undefined }}
          >
            {label}
          </ResourceLink>
        </li>
      ))}
    </Ul>
  ) : (
    <>{commonText.loading()}</>
  );
}

export function ShowLoansCommand({
  preparation,
  onClose: handleClose,
}: {
  readonly preparation: SpecifyResource<Preparation>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        f.all({
          openLoans: hasTablePermission('LoanPreparation', 'read')
            ? fetchCollection('LoanPreparation', {
                isResolved: false,
                limit: DEFAULT_FETCH_LIMIT,
                preparation: preparation.get('id'),
                domainFilter: false,
              }).then(({ records }) => records.map(deserializeResource))
            : undefined,
          resolvedLoans: hasTablePermission('LoanPreparation', 'read')
            ? fetchCollection('LoanPreparation', {
                isResolved: true,
                limit: DEFAULT_FETCH_LIMIT,
                preparation: preparation.get('id'),
                domainFilter: false,
              }).then(({ records }) => records.map(deserializeResource))
            : undefined,
          gifts: hasTablePermission('GiftPreparation', 'read')
            ? fetchCollection('GiftPreparation', {
                limit: DEFAULT_FETCH_LIMIT,
                preparation: preparation.get('id'),
                domainFilter: false,
              }).then(({ records }) => records.map(deserializeResource))
            : undefined,
          exchangeOuts: hasTablePermission('ExchangeOutPrep', 'read')
            ? fetchCollection('ExchangeOutPrep', {
                limit: DEFAULT_FETCH_LIMIT,
                preparation: preparation.get('id'),
                domainFilter: false,
              }).then(({ records }) => records.map(deserializeResource))
            : undefined,
          exchangeIns: hasTablePermission('ExchangeInPrep', 'read')
            ? fetchCollection('ExchangeInPrep', {
                limit: DEFAULT_FETCH_LIMIT,
                preparation: preparation.get('id'),
                domainFilter: false,
              }).then(({ records }) => records.map(deserializeResource))
            : undefined,
          disposals: hasTablePermission('Disposal', 'read')
            ? fetchCollection('DisposalPreparation', {
                limit: DEFAULT_FETCH_LIMIT,
                preparation: preparation.get('id'),
                domainFilter: false,
              }).then(({ records }) => records.map(deserializeResource))
            : undefined,
        }),
      [preparation]
    ),
    true
  );

  const hasAnyInteractions = data && [
    data.openLoans,
    data.resolvedLoans,
    data.gifts,
    data.exchangeOuts,
    data.exchangeIns,
    data.disposals,
  ].some(interactions => Array.isArray(interactions) && interactions.length > 0);

  return typeof data === 'object' ? (
    <Dialog
      buttons={commonText.close()}
      header={interactionsText.interactions()}
      icon={icons.chat}
      onClose={handleClose}
    >
    {hasAnyInteractions ? (
        <>
          {Array.isArray(data.openLoans) && data.openLoans.length > 0 && (
            <>
              <H3 className="flex items-center gap-2">
                <TableIcon label name={tables.Loan.name} />
                {interactionsText.openLoans({
                  loanTable: tables.Loan.label,
                })}
              </H3>
              <List
                displayFieldName="loanNumber"
                fieldName="loan"
                resources={data.openLoans}
              />
            </>
          )}
          {Array.isArray(data.resolvedLoans) && data.resolvedLoans.length > 0 && (
            <>
              <H3 className="flex items-center gap-2">
                <TableIcon label name={tables.Loan.name} />
                {interactionsText.resolvedLoans({
                  loanTable: tables.Loan.label,
                })}
              </H3>
              <List
                displayFieldName="loanNumber"
                fieldName="loan"
                resources={data.resolvedLoans}
              />
            </>
          )}
          {Array.isArray(data.gifts) && data.gifts.length > 0 && (
            <>
              <H3 className="flex items-center gap-2">
                <TableIcon label name={tables.Gift.name} />
                {interactionsText.gifts({
                  giftTable: tables.Gift.label,
                })}
              </H3>
              <List
                displayFieldName="giftNumber"
                fieldName="gift"
                resources={data.gifts}
              />
            </>
          )}
          {Array.isArray(data.disposals) && data.disposals.length > 0 && (
            <>
              <H3 className="flex items-center gap-2">
                <TableIcon label name={tables.Disposal.name} />
                {interactionsText.disposals({
                  disposalTable: tables.Disposal.label,
                })}
              </H3>
              <List
                displayFieldName="disposalNumber"
                fieldName="disposal"
                resources={data.disposals}
              />
            </>
          )}
          {Array.isArray(data.exchangeOuts) && data.exchangeOuts.length > 0 && (
            <>
              <H3 className="flex items-center gap-2">
                <TableIcon label name={tables.ExchangeOut.name} />
                {interactionsText.exchangeOut({
                  exchangeOutTable: tables.ExchangeOut.label,
                })}
              </H3>
              <List
                displayFieldName="exchangeOutNumber"
                fieldName="exchangeOut"
                resources={data.exchangeOuts}
              />
            </>
          )}
          {Array.isArray(data.exchangeIns) && data.exchangeIns.length > 0 && (
            <>
              <H3 className="flex items-center gap-2">
                <TableIcon label name={tables.ExchangeIn.name} />
                {interactionsText.exchangeIn({
                  exchangeInTable: tables.ExchangeIn.label,
                })}
              </H3>
              <List
                displayFieldName="exchangeInNumber"
                fieldName="exchangeIn"
                resources={data.exchangeIns}
              />
            </>
          )}
        </>
      ) : (
        <>
        {interactionsText.noInteractions({
                  preparationTable: String(tables.Preparation.label).toLowerCase(),
                })}
        </>
      )}
    </Dialog>
  ) : null;
}  