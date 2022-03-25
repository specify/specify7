import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import { error } from '../assert';
import type { RecordSet, Tables } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import { getView } from '../parseform';
import { getAttribute } from '../parseformcells';
import reports from '../reports';
import { getResourceViewUrl } from '../resource';
import { getModel, schema } from '../schema';
import { SpecifyModel } from '../specifymodel';
import * as s from '../stringlocalization';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { f } from '../wbplanviewhelper';
import { className, Link, Ul } from './basic';
import { TableIcon } from './common';
import { LoadingContext } from './contexts';
import { useAsyncState, useTitle } from './hooks';
import { InteractionDialog } from './interactiondialog';
import { Dialog, dialogClassNames } from './modaldialog';

const supportedActions = [
  'NEW_GIFT',
  'NEW_LOAN',
  'RET_LOAN',
  'PRINT_INVOICE',
] as const;

type Entry = {
  readonly action: typeof supportedActions[number] | undefined;
  readonly table: keyof Tables;
  readonly label: string | undefined;
  readonly tooltip: string | undefined;
  readonly icon: string | undefined;
};

const entriesPromise = ajax<Element>(
  '/context/app.resource?name=InteractionsTaskInit',
  { headers: { Accept: 'application/xml' } }
).then<RA<Entry>>(async ({ data }) =>
  Promise.all(
    Array.from(data.querySelectorAll('entry'), async (entry) =>
      f.var(getAttribute(entry, 'action'), async (action) =>
        getAttribute(entry, 'isOnLeft')?.toLowerCase() === 'true'
          ? ({
              action: f.includes(supportedActions, action) ? action : undefined,
              table:
                action === 'NEW_GIFT'
                  ? 'Gift'
                  : typeof action === 'string'
                  ? 'Loan'
                  : await getView(getAttribute(entry, 'view') ?? '').then(
                      (view) =>
                        SpecifyModel.parseClassName(view.class) as keyof Tables
                    ),
              label: getAttribute(entry, 'label'),
              tooltip: getAttribute(entry, 'tooltip'),
              icon: getAttribute(entry, 'icon'),
            } as const)
          : undefined
      )
    )
  ).then(filterArray)
);

function Interactions({
  onClose: handleClose,
  urlParameter,
  entries,
}: {
  readonly onClose: () => void;
  readonly urlParameter: string | undefined;
  readonly entries: Awaited<typeof entriesPromise>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<
        'InteractionState',
        {
          readonly table: 'Loan' | 'CollectionObject';
          readonly actionModel: SpecifyModel;
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
        const recordSets = new schema.models.RecordSet.LazyCollection({
          filters: {
            specifyuser: userInformation.id,
            type: 0,
            dbtableid: model.tableId,
            domainfilter: true,
            orderby: '-timestampcreated',
          },
        });
        setState({
          type: 'InteractionState',
          recordSetsPromise: recordSets
            .fetchPromise({ limit: 5000 })
            .then((collection) => ({
              recordSets: collection.models,
              totalCount: defined(collection._totalCount),
            })),
          table: model.name,
          actionModel: defined(getModel(table)),
          action,
        });
      }
    },
    [loading]
  );

  React.useEffect(
    () =>
      f.maybe(
        entries.find(({ action }) => action === urlParameter),
        ({ action, table }) => handleAction(defined(action), table)
      ),
    [urlParameter, entries]
  );

  return state.type === 'MainState' ? (
    <Dialog
      header={commonText('interactions')}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      <Ul>
        {entries.map(({ label, table, action, tooltip, icon }, index) => (
          <li
            key={index}
            title={
              typeof tooltip === 'string'
                ? s.localizeFrom('resources', tooltip)
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
                  ? (): void => handleAction(action, table)
                  : undefined
              }
            >
              {typeof label === 'string'
                ? s.localizeFrom('resources', label)
                : typeof table === 'string'
                ? getModel(table)?.label
                : action}
              {f.maybe(icon ?? table, (icon) => (
                <TableIcon name={icon} tableLabel={false} />
              ))}
            </Link.Default>
          </li>
        ))}
      </Ul>
    </Dialog>
  ) : state.type === 'InteractionState' ? (
    <InteractionDialog
      recordSetsPromise={state.recordSetsPromise}
      model={
        state.table === 'Loan'
          ? schema.models.Loan
          : schema.models.CollectionObject
      }
      searchField={defined(
        defined(getModel(state.table)).getLiteralField(
          state.table === 'Loan' ? 'LoanNumber' : 'catalogNumber'
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

  const [entries] = useAsyncState(
    React.useCallback(async () => entriesPromise, []),
    true
  );

  return typeof entries === 'object' ? (
    <Interactions
      onClose={handleClose}
      urlParameter={urlParameter}
      entries={entries}
    />
  ) : null;
}
