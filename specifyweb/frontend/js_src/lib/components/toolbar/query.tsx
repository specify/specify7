import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../../ajax';
import { error } from '../../assert';
import type { SpQuery, SpReport } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import { serializeResource } from '../../datamodelutils';
import type { SpecifyResource } from '../../legacytypes';
import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import schema, { getModel, getModelById } from '../../schema';
import type { IR, RA } from '../../types';
import { defined } from '../../types';
import { Button, Form, Input, Link, Submit, Ul } from '../basic';
import { compareValues, SortIndicator, TableIcon } from '../common';
import { EditResourceDialog } from '../editresourcedialog';
import { useAsyncState, useId, useTitle } from '../hooks';
import { icons } from '../icons';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { Dialog, dialogClassNames, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { useCachedState } from '../stateCache';
import { userInformation } from '../../userinfo';

const tablesToShowPromise: Promise<RA<string>> = ajax<Document>(
  '/static/config/querybuilder.xml',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  { headers: { Accept: 'application/xml' } }
)
  .then(({ data: document }) =>
    Array.from(
      document.querySelectorAll('database > table'),
      (table) => table.getAttribute('name')?.toLowerCase() ?? ''
    )
      .filter(
        (tableName) =>
          tableName &&
          (tableName !== 'spauditlog' || userInformation.usertype === 'Manager')
      )
      .sort()
  )
  .catch((error) => {
    console.error(error);
    return [];
  });

function QueryList({
  queries: unsortedQueries,
  onEdit: handleEdit,
  getQuerySelectUrl,
}: {
  readonly queries: RA<SerializedResource<SpQuery>>;
  readonly onEdit?: (query: SerializedResource<SpQuery>) => void;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
}): JSX.Element | null {
  const [sortConfig, setSortConfig] = useCachedState({
    bucketName: 'sortConfig',
    cacheName: 'listOfQueries',
    bucketType: 'localStorage',
    defaultValue: {
      sortField: 'timestampCreated',
      ascending: false,
    },
  });

  if (typeof sortConfig === 'undefined') return null;

  const queries = Array.from(unsortedQueries).sort(
    (
      { name: nameLeft, timestampCreated: dateCreatedLeft },
      { name: nameRight, timestampCreated: dateCreatedRight }
    ) =>
      sortConfig.sortField === 'name'
        ? compareValues(sortConfig.ascending, nameLeft, nameRight)
        : compareValues(sortConfig.ascending, dateCreatedLeft, dateCreatedRight)
  );

  return (
    <table className="grid-table grid-cols-[auto_auto_min-content] gap-2">
      <thead>
        <tr>
          <th
            scope="col"
            className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
          >
            <Button.LikeLink
              onClick={(): void =>
                setSortConfig({
                  sortField: 'name',
                  ascending: !sortConfig.ascending,
                })
              }
            >
              {commonText('name')}
              <SortIndicator fieldName="name" sortConfig={sortConfig} />
            </Button.LikeLink>
          </th>
          <th scope="col">
            <Button.LikeLink
              onClick={(): void =>
                setSortConfig({
                  sortField: 'timestampCreated',
                  ascending: !sortConfig.ascending,
                })
              }
            >
              {commonText('created')}
              <SortIndicator
                fieldName="timestampCreated"
                sortConfig={sortConfig}
              />
            </Button.LikeLink>
          </th>
          <td />
        </tr>
      </thead>
      <tbody>
        {queries.map((query) => (
          <tr key={query.id}>
            <td>
              <Link.Default
                href={
                  getQuerySelectUrl?.(query) ?? `/specify/query/${query.id}/`
                }
                className="intercept-navigation overflow-x-auto"
              >
                <TableIcon
                  tableName={getModelById(
                    query.contextTableId
                  ).name.toLowerCase()}
                  tableLabel={false}
                />
                {query.name}
              </Link.Default>
            </td>
            <td>
              <DateElement date={query.timestampCreated} />
            </td>
            <td className="justify-end">
              {typeof handleEdit === 'function' && (
                <Button.Icon
                  icon="pencil"
                  role="link"
                  aria-label={commonText('edit')}
                  title={commonText('edit')}
                  onClick={(): void => handleEdit(query)}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ListOfTables({
  tables,
  getQueryCreateUrl,
}: {
  readonly tables: RA<string>;
  readonly getQueryCreateUrl: (tableName: string) => string;
}): JSX.Element {
  return (
    <Ul>
      {tables.map((tableName, index) => (
        <li key={index}>
          <Link.Default
            href={getQueryCreateUrl(tableName)}
            className="intercept-navigation"
          >
            <TableIcon tableName={tableName} tableLabel={false} />
            {defined(getModel(tableName)).getLocalizedName()}
          </Link.Default>
        </li>
      ))}
    </Ul>
  );
}

type ShowQueryListState = State<'ShowQueryListState'>;
type CreateQueryState = State<'CreateQueryState'>;
type EditQueryState = State<
  'EditQueryState',
  {
    queryModel: SpecifyResource<SpQuery>;
  }
>;
type States = ShowQueryListState | CreateQueryState | EditQueryState;

const QUERY_FETCH_LIMIT = 5000;

function QueryToolbarItem({
  onClose: handleClose,
  getQueryCreateUrl,
  getQuerySelectUrl,
  spQueryFilter,
  newQueryButtonGenerator,
  readOnly,
}: {
  readonly onClose: () => void;
  readonly getQueryCreateUrl?: (tableName: string) => string;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
  readonly spQueryFilter?: IR<unknown>;
  readonly newQueryButtonGenerator?: (state: States) => () => void;
  readonly readOnly: boolean;
}): JSX.Element {
  useTitle(commonText('queries'));

  const [tablesToShow] = useCachedState({
    bucketName: 'common',
    cacheName: 'listOfQueryTables',
    bucketType: 'sessionStorage',
    defaultValue: async () => tablesToShowPromise,
  });

  const [queries] = useAsyncState<RA<SerializedResource<SpQuery>>>(
    React.useCallback(async () => {
      const queryModels = new schema.models.SpQuery.LazyCollection({
        filters: spQueryFilter ?? { specifyuser: userInformation.id },
      });
      return queryModels
        .fetchPromise({ limit: QUERY_FETCH_LIMIT })
        .then(({ models }) => models.map(serializeResource));
    }, [spQueryFilter])
  );

  const [state, setState] = React.useState<States>({
    type: 'ShowQueryListState',
  });

  if (state.type === 'ShowQueryListState') {
    return typeof queries === 'undefined' ? (
      <LoadingScreen />
    ) : (
      <Dialog
        header={commonText('queriesDialogTitle')(queries.length)}
        onClose={handleClose}
        buttons={
          <>
            <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
            <Button.Blue
              onClick={
                // TODO: simplify this once RecordSetsDialog is rewritten to React
                newQueryButtonGenerator?.(state) ??
                ((): void =>
                  setState({
                    type: 'CreateQueryState',
                  }))
              }
            >
              {commonText('new')}
            </Button.Blue>
          </>
        }
      >
        <QueryList
          queries={queries}
          onEdit={
            readOnly
              ? undefined
              : (queryResource): void =>
                  setState({
                    type: 'EditQueryState',
                    queryModel: new schema.models.SpQuery.Resource(
                      queryResource
                    ),
                  })
          }
          getQuerySelectUrl={getQuerySelectUrl}
        />
      </Dialog>
    );
  } else if (
    state.type === 'CreateQueryState' &&
    typeof getQueryCreateUrl !== 'undefined'
  )
    return typeof tablesToShow === 'undefined' ? (
      <LoadingScreen />
    ) : (
      <Dialog
        onClose={handleClose}
        className={{
          container: dialogClassNames.narrowContainer,
        }}
        header={commonText('newQueryDialogTitle')}
        buttons={
          <Button.Transparent
            onClick={(): void => setState({ type: 'ShowQueryListState' })}
          >
            {commonText('cancel')}
          </Button.Transparent>
        }
      >
        <ListOfTables
          tables={tablesToShow}
          getQueryCreateUrl={getQueryCreateUrl}
        />
      </Dialog>
    );
  else if (state.type === 'EditQueryState' && !readOnly)
    return (
      <EditQueryDialog queryResource={state.queryModel} onClose={handleClose} />
    );
  else throw new Error('Invalid ToolbarQuery State type');
}

export const QueryToolbarView = createBackboneView(QueryToolbarItem);

const menuItem: MenuItem = {
  task: 'query',
  title: commonText('queries'),
  icon: icons.documentSearch,
  view: ({ onClose }) =>
    new QueryToolbarView({
      onClose,
      getQueryCreateUrl: userInformation.isReadOnly
        ? undefined
        : (tableName: string): string => `/specify/query/new/${tableName}/`,
      getQuerySelectUrl: undefined,
      readOnly: userInformation.isReadOnly,
    }),
};

export default menuItem;

function EditQueryDialog({
  queryResource,
  readOnly,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly readOnly?: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<
    'default' | 'dwcaExport' | 'reportExport' | 'labelExport' | 'report'
  >('default');

  return state === 'default' ? (
    <EditResourceDialog
      resource={queryResource}
      readOnly={readOnly}
      onSaved={(): void => {
        navigation.go(`/query/${queryResource.id}/`);
      }}
      onClose={handleClose}
    >
      {!queryResource.isNew() && (
        <>
          <p className="pt-2">${commonText('actions')}</p>
          <div>
            <Button.LikeLink onClick={(): void => setState('dwcaExport')}>
              ${commonText('exportQueryForDwca')}
            </Button.LikeLink>
            <button type="button" className="create-report link">
              ${commonText('exportQueryAsReport')}
            </button>
            <button type="button" className="create-label link">
              ${commonText('exportQueryAsLabel')}
            </button>
          </div>
        </>
      )}
    </EditResourceDialog>
  ) : state === 'dwcaExport' ? (
    <DwcaQueryExport queryResource={queryResource} onClose={handleClose} />
  ) : state === 'reportExport' || state === 'labelExport' ? (
    <QueryExport
      queryResource={queryResource}
      onClose={handleClose}
      asLabel={state === 'labelExport'}
    />
  ) : (
    error('Invalid state')
  );
}

function DwcaQueryExport({
  queryResource,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element {
  const [exported] = useAsyncState<string>(
    React.useCallback(
      async () =>
        ajax(`/export/extract_query/${queryResource.id}/`, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'text/plain' },
        }).then(({ data: xml }) => xml),
      [queryResource.id]
    )
  );

  return typeof exported === 'string' ? (
    <Dialog
      title={commonText('exportQueryForDwcaDialogTitle')}
      header={commonText('exportQueryForDwcaDialogHeader')}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      buttons={commonText('close')}
      onClose={handleClose}
    >
      {/* TODO: improve styling */}
      <textarea cols={120} rows={40} readOnly>
        {exported}
      </textarea>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}

function QueryExport({
  queryResource,
  onClose: handleClose,
  asLabel,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly asLabel: boolean;
}): JSX.Element {
  const id = useId('query-export');
  const [name, setName] = React.useState<string>('');

  return (
    <Dialog
      title={
        asLabel
          ? commonText('createLabelDialogTitle')
          : commonText('createReportDialogTitle')
      }
      header={
        asLabel
          ? commonText('createLabelDialogHeader')
          : commonText('createReportDialogHeader')
      }
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')} value={commonText('create')} />
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(): void => {
          ajax<SerializedResource<SpReport>>('/report_runner/create/', {
            method: 'POST',
            body: {
              queryid: queryResource.id,
              mimetype: asLabel ? 'jrxml/label' : 'jrxml/report',
              name: name.trim(),
            },
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              Accept: 'application/json',
            },
          })
            .then(async ({ data: reportJson }) => {
              const report = new schema.models.SpReport.Resource(reportJson);
              return report.rgetPromise('appResource');
            })
            .then((appResource) =>
              navigation.go(`/specify/appresources/${appResource.id}/`)
            )
            .catch(console.error);
        }}
      >
        <Input
          type="text"
          placeholder={
            asLabel ? commonText('labelName') : commonText('reportName')
          }
          required
          value={name}
          onChange={({ target }): void => setName(target.value)}
        />
      </Form>
    </Dialog>
  );
}
