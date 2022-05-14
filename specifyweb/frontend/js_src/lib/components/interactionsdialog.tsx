import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import { error } from '../assert';
import { fetchCollection } from '../collection';
import type { Disposal, Gift, Loan, RecordSet, Tables } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { getBooleanAttribute, getParsedAttribute } from '../helpers';
import { cachableUrl } from '../initialcontext';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { getView } from '../parseform';
import { hasPermission, hasTablePermission } from '../permissions';
import { formatUrl } from '../querystring';
import { getResourceViewUrl, parseClassName } from '../resource';
import { getModel, schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { className, Link, Ul } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useTitle } from './hooks';
import { icons } from './icons';
import { InteractionDialog } from './interactiondialog';
import { Dialog, dialogClassNames } from './modaldialog';
import { ReportsView } from './reports';

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

const url = cachableUrl(
  formatUrl('/context/app.resource', { name: 'InteractionsTaskInit' })
);
const fetchEntries = f.store(
  async (): Promise<RA<InteractionEntry>> =>
    ajax<Element>(url, {
      headers: { Accept: 'application/xml' },
    }).then<RA<InteractionEntry>>(async ({ data }) =>
      Promise.all(
        Array.from(data.querySelectorAll('entry'), async (entry) =>
          f.var(getParsedAttribute(entry, 'action'), async (action) =>
            getBooleanAttribute(entry, 'isOnLeft') ?? false
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
                            .maybe(getParsedAttribute(entry, 'view'), getView)
                            ?.then((view) =>
                              typeof view === 'object'
                                ? (parseClassName(view.class) as keyof Tables)
                                : undefined
                            )) ??
                            getModel(getParsedAttribute(entry, 'table') ?? '')
                              ?.name
                        ),
                  label: getParsedAttribute(entry, 'label'),
                  tooltip: getParsedAttribute(entry, 'tooltip'),
                  icon: getParsedAttribute(entry, 'icon'),
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
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<
        'InteractionState',
        {
          readonly table: 'Loan' | 'Disposal' | 'Gift' | 'CollectionObject';
          readonly actionModel: SpecifyModel<Loan | Disposal | Gift>;
          readonly action: string;
          readonly recordSetsPromise: Promise<{
            readonly records: RA<SerializedResource<RecordSet>>;
            readonly totalCount: number;
          }>;
        }
      >
    | State<'ReportsState'>
  >({ type: 'MainState' });
  const handleAction = React.useCallback(function (
    action: typeof supportedActions[number],
    table: keyof Tables
  ): void {
    if (action === 'PRINT_INVOICE') setState({ type: 'ReportsState' });
    else {
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
        }),
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
  []);

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
          .map(({ label, table, action, tooltip, icon }, index) =>
            action !== 'PRINT_INVOICE' ||
            hasPermission('/report', 'execute') ? (
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
                      ? `/specify/task/interactions/${action}/`
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
            ) : undefined
          )}
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
  ) : state.type === 'ReportsState' ? (
    <ReportsView
      model={schema.models.Loan}
      autoSelectSingle={true}
      onClose={handleClose}
      resourceId={undefined}
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
