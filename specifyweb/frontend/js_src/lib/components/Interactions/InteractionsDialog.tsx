import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Ul } from '../Atoms';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { getResourceViewUrl } from '../DataModel/resource';
import { getTable, tables } from '../DataModel/tables';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { cachableUrl } from '../InitialContext';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { ReportsView } from '../Reports';
import { formatUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';
import { xmlToSpec } from '../Syncer/xmlUtils';
import { InteractionDialog } from './InteractionDialog';
import type { InteractionEntry } from './spec';
import { interactionEntries } from './spec';

export const interactionTables: ReadonlySet<keyof Tables> = new Set<
  keyof Tables
>([
  'Accession',
  'AccessionAgent',
  'AccessionAttachment',
  'AccessionAuthorization',
  'AccessionCitation',
  'Appraisal',
  'Borrow',
  'BorrowAgent',
  'BorrowAttachment',
  'BorrowMaterial',
  'BorrowReturnMaterial',
  'Deaccession',
  'DeaccessionAgent',
  'DeaccessionAttachment',
  'Disposal',
  'DisposalAgent',
  'DisposalAttachment',
  'DisposalPreparation',
  'ExchangeIn',
  'ExchangeInPrep',
  'ExchangeOut',
  'ExchangeOutPrep',
  'Gift',
  'GiftAgent',
  'GiftAttachment',
  'GiftPreparation',
  'InfoRequest',
  'Loan',
  'LoanAgent',
  'LoanAttachment',
  'LoanPreparation',
  'LoanReturnPreparation',
  'Permit',
  'PermitAttachment',
]);

/**
 * Remap Specify 6 UI localization strings to Specify 7 UI localization strings
 */
const stringLocalization = f.store(() => ({
  RET_LOAN: interactionsText.returnLoan({
    tableLoan: tables.Loan.label,
  }),
  PRINT_INVOICE: interactionsText.printInvoice(),
  'InteractionsTask.PRT_INV': interactionsText.printInvoice(),
}));

const url = cachableUrl(
  formatUrl('/context/app.resource', { name: 'InteractionsTaskInit' })
);
const fetchEntries = f.store(async () =>
  ajax<Element>(url, {
    headers: { Accept: 'text/xml' },
  }).then(({ data }) =>
    filterArray(
      xmlToSpec(data, interactionEntries()).entry.map((entry) =>
        entry.isFavorite && typeof entry.table === 'object' ? entry : undefined
      )
    )
  )
);

function Interactions({
  onClose: handleClose,
  entries,
}: {
  readonly onClose: () => void;
  readonly entries: RA<InteractionEntry>;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<
        'InteractionState',
        Omit<Parameters<typeof InteractionDialog>[0], 'searchField'>
      >
    | State<'MainState'>
    | State<'ReportsState'>
  >({ type: 'MainState' });
  const handleAction = React.useCallback(
    (
      action: InteractionEntry['action'] & string,
      actionTable: SpecifyTable
    ): void => {
      if (action === 'PRINT_INVOICE') setState({ type: 'ReportsState' });
      else {
        // FIXME: extend this list
        const isRecordSetAction =
          action === 'NEW_GIFT' || action === 'NEW_LOAN';
        setState({
          type: 'InteractionState',
          table: isRecordSetAction ? tables.CollectionObject : tables.Loan,
          action: {
            table: actionTable,
            name: action,
          },
        });
      }
    },
    []
  );

  const { action } = useParams();
  React.useEffect(
    () =>
      typeof action === 'string'
        ? f.maybe(
            entries.find((entry) => entry.action === action),
            ({ action, table }) => handleAction(action!, table!)
          )
        : undefined,
    [action, entries, handleAction]
  );

  return state.type === 'MainState' ? (
    <Dialog
      buttons={commonText.cancel()}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={interactionsText.interactions()}
      icon={<span className="text-blue-500">{icons.chat}</span>}
      onClose={handleClose}
    >
      <Ul>
        {entries
          .filter(({ table }) => hasTablePermission(table!.name, 'create'))
          .map(({ label, table, action, tooltip, icon = table?.name }, index) =>
            action !== 'PRINT_INVOICE' ||
            hasPermission('/report', 'execute') ? (
              <li
                key={index}
                title={
                  stringLocalization()[
                    (tooltip ?? '') as keyof ReturnType<
                      typeof stringLocalization
                    >
                  ] ?? table?.label
                }
              >
                <Link.Default
                  href={
                    typeof action === 'string'
                      ? `/specify/overlay/interactions/${action}/`
                      : getResourceViewUrl(table!.name)
                  }
                  onClick={
                    typeof action === 'string'
                      ? (event): void => {
                          event.preventDefault();
                          handleAction(action, table!);
                        }
                      : undefined
                  }
                >
                  {typeof icon === 'string' && (
                    <TableIcon label={false} name={icon} />
                  )}
                  {typeof label === 'string'
                    ? stringLocalization()[
                        label as keyof ReturnType<typeof stringLocalization>
                      ] ?? label
                    : typeof table === 'string'
                    ? getTable(table)?.label
                    : (action as LocalizedString)}
                </Link.Default>
              </li>
            ) : undefined
          )}
      </Ul>
    </Dialog>
  ) : state.type === 'InteractionState' ? (
    <InteractionDialog {...state} onClose={handleClose} />
  ) : state.type === 'ReportsState' ? (
    <ReportsView
      autoSelectSingle
      table={tables.Loan}
      resourceId={undefined}
      onClose={handleClose}
    />
  ) : (
    error('Invalid state')
  );
}

export function InteractionsOverlay(): JSX.Element | null {
  const [entries] = useAsyncState(fetchEntries, true);
  const handleClose = React.useContext(OverlayContext);

  return typeof entries === 'object' ? (
    <ErrorBoundary dismissible>
      <Interactions entries={entries} onClose={handleClose} />
    </ErrorBoundary>
  ) : null;
}

export const exportsForTests = {
  fetchEntries,
};
