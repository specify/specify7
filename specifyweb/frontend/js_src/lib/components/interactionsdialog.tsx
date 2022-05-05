import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import { error } from '../assert';
import { fetchCollection } from '../collection';
import type { Disposal, Gift, Loan, RecordSet, Tables } from '../datamodel';
import { f } from '../functools';
import { getAttribute } from '../helpers';
import { cachableUrl } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { getView } from '../parseform';
import { hasTablePermission } from '../permissions';
import { reports } from '../reports';
import { getResourceViewUrl, parseClassName } from '../resource';
import { getModel, schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { className, Link, Ul } from './basic';
import { TableIcon } from './common';
import { LoadingContext } from './contexts';
import { useAsyncState, useTitle } from './hooks';
import { icons } from './icons';
import { InteractionDialog } from './interactiondialog';
import { Dialog, dialogClassNames } from './modaldialog';
import { deserializeResource } from './resource';

const supportedActions = [
  'NEW_GIFT',
  'NEW_LOAN',
  'RET_LOAN',
  'PRINT_INVOICE',
] as const;

const stringLocalization = {
  RET_LOAN: formsText('returnLoan'),
  PRINT_INVOICE: formsText('printInvoice'),
  LOAN_NO_PRP: formsText('loanWithoutPreparation'),
  'InteractionsTask.LN_NO_PREP': formsText('loanWithoutPreparationDescription'),
  'InteractionsTask.NEW_LN': formsText('createLoan'),
  'InteractionsTask.EDT_LN': formsText('editLoan'),
  'InteractionsTask.NEW_GFT': formsText('createdGift'),
  'InteractionsTask.EDT_GFT': formsText('editGift'),
  'InteractionsTask.CRE_IR': formsText('createInformationRequest'),
  'InteractionsTask.PRT_INV': formsText('printInvoice'),
};

export type InteractionEntry = {
  readonly action: typeof supportedActions[number] | undefined;
  readonly table: keyof Tables;
  readonly label: string | undefined;
  readonly tooltip: string | undefined;
  readonly icon: string | undefined;
};

const url = cachableUrl('/context/app.resource?name=InteractionsTaskInit');
const fetchEntries = f.store(
  async (): Promise<RA<InteractionEntry>> =>
    ajax<Element>(url, {
      headers: { Accept: 'application/xml' },
    }).then<RA<InteractionEntry>>(async ({ data }) =>
      Promise.all(
        Array.from(data.querySelectorAll('entry'), async (entry) =>
          f.var(getAttribute(entry, 'action'), async (action) =>
            getAttribute(entry, 'isOnLeft')?.toLowerCase() === 'true'
              ? ({
                  action: f.includes(supportedActions, action)
                    ? action
                    : undefined,
                  table:
                    action === 'NEW_GIFT'
                      ? 'Gift'
                      : action === 'NEW_LOAN'
                      ? 'Loan'
                      : defined(
                          (await f
                            .maybe(getAttribute(entry, 'view'), getView)
                            ?.then((view) =>
                              typeof view === 'object'
                                ? (parseClassName(view.class) as keyof Tables)
                                : undefined
                            )) ??
                            getModel(getAttribute(entry, 'table') ?? '')?.name
                        ),
                  label: getAttribute(entry, 'label') || undefined,
                  tooltip: getAttribute(entry, 'tooltip') || undefined,
                  icon: getAttribute(entry, 'icon'),
                } as const)
              : undefined
          )
        )
      ).then(filterArray)
    )
);

function Interactions({
  onClose: handleClose,
  urlParameter,
  entries,
}: {
  readonly onClose: () => void;
  readonly urlParameter: string | undefined;
  readonly entries: RA<InteractionEntry>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<
        'InteractionState',
        {
          readonly table: 'Loan' | 'Disposal' | 'Gift' | 'CollectionObject';
          readonly actionModel: SpecifyModel<Loan | Disposal | Gift>;
          readonly action: string;
          readonly recordSetsPromise: Promise<{
            readonly recordSets: RA<SpecifyResource<RecordSet>>;
            readonly totalCount: number;
          }>;
        }
      >
  >({ type: 'MainState' });
  const handleAction = React.useCallback(
    function (
      action: typeof supportedActions[number],
      table: keyof Tables
    ): void {
      if (action === 'PRINT_INVOICE') {
        loading(
          reports({
            // Assuming loan invoice for now
            tblId: schema.models.Loan.tableId,
            // MetaDataFilter:  {prop: 'reporttype', val: 'invoice'},
            autoSelectSingle: true,
          }).then((view) => view.render())
        );
      } else {
        const isRecordSetAction = action == 'NEW_GIFT' || action == 'NEW_LOAN';
        const model = isRecordSetAction
          ? schema.models.CollectionObject
          : schema.models.Loan;
        setState({
          type: 'InteractionState',
          recordSetsPromise: fetchCollection('RecordSet', {
            specifyUser: userInformation.id,
            type: 0,
            dbTableId: model.tableId,
            domainFilter: true,
            orderBy: '-timestampCreated',
            limit: 5000,
          }).then(({ records, totalCount }) => ({
            recordSets: records.map(deserializeResource),
            totalCount,
          })),
          table: model.name,
          actionModel:
            table.toLowerCase() === 'loan'
              ? schema.models.Loan
              : table.toLowerCase() === 'gift'
              ? schema.models.Gift
              : table.toLowerCase() === 'gift'
              ? schema.models.Disposal
              : error(`Unknown interaction table: ${table}`),
          action,
        });
      }
    },
    [loading]
  );

  React.useEffect(
    () =>
      typeof urlParameter === 'string'
        ? f.maybe(
            entries.find(({ action }) => action === urlParameter),
            ({ action, table }) => handleAction(defined(action), table)
          )
        : undefined,
    [urlParameter, entries]
  );

  return state.type === 'MainState' ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.chat}</span>}
      header={commonText('interactions')}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      <Ul>
        {entries
          .filter(({ table }) => hasTablePermission(table, 'create'))
          .map(({ label, table, action, tooltip, icon }, index) => (
            <li
              key={index}
              title={
                typeof tooltip === 'string'
                  ? stringLocalization[
                      tooltip as keyof typeof stringLocalization
                    ] ?? tooltip
                  : undefined
              }
            >
              <Link.Default
                href={
                  typeof action === 'string'
                    ? `/specify/task/interactions/${action}`
                    : getResourceViewUrl(table)
                }
                className={
                  typeof action === 'string'
                    ? className.navigationHandled
                    : undefined
                }
                onClick={
                  typeof action === 'string'
                    ? (event): void => {
                        event.preventDefault();
                        handleAction(action, table);
                      }
                    : undefined
                }
              >
                {f.maybe(icon ?? table, (icon) => (
                  <TableIcon name={icon} tableLabel={false} />
                ))}
                {typeof label === 'string'
                  ? stringLocalization[
                      label as keyof typeof stringLocalization
                    ] ?? label
                  : typeof table === 'string'
                  ? getModel(table)?.label
                  : action}
              </Link.Default>
            </li>
          ))}
      </Ul>
    </Dialog>
  ) : state.type === 'InteractionState' ? (
    <InteractionDialog
      recordSetsPromise={state.recordSetsPromise}
      model={schema.models[state.table]}
      searchField={defined(
        defined(getModel(state.table)).getLiteralField(
          state.table === 'Loan'
            ? 'loanNumber'
            : state.table === 'Disposal'
            ? 'disposalNumber'
            : 'catalogNumber'
        )
      )}
      onClose={handleClose}
      action={{ model: state.actionModel, name: state.action }}
    />
  ) : (
    error('Invalid state')
  );
}

export function InteractionsDialog({
  onClose: handleClose,
  urlParameter,
}: {
  readonly onClose: () => void;
  readonly urlParameter: string | undefined;
}): JSX.Element | null {
  useTitle(commonText('interactions'));

  const [entries] = useAsyncState(fetchEntries, true);

  return typeof entries === 'object' ? (
    <Interactions
      onClose={handleClose}
      urlParameter={urlParameter}
      entries={entries}
    />
  ) : null;
}
