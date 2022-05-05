/**
 * Display a list of queries
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, formData, Http } from '../../ajax';
import { error } from '../../assert';
import type { CollectionFetchFilters } from '../../collection';
import { fetchCollection } from '../../collection';
import type { SpQuery, SpReport, Tables } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import { f } from '../../functools';
import { removeKey } from '../../helpers';
import { cachableUrl } from '../../initialcontext';
import type { SpecifyResource } from '../../legacytypes';
import { commonText } from '../../localization/common';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../../permissions';
import { getUserPref } from '../../preferencesutils';
import { getModel, getModelById, schema } from '../../schema';
import type { RA } from '../../types';
import { defined, filterArray } from '../../types';
import { userInformation } from '../../userinfo';
import { getUniqueName } from '../../wbuniquifyname';
import { Button, DataEntry, Form, Input, Link, Submit, Ul } from '../basic';
import {
  AutoGrowTextArea,
  compareValues,
  SortIndicator,
  TableIcon,
} from '../common';
import { LoadingContext } from '../contexts';
import { downloadFile, FilePicker, fileToText } from '../filepicker';
import { useAsyncState, useId, useTitle } from '../hooks';
import { icons } from '../icons';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { Dialog, dialogClassNames, LoadingScreen } from '../modaldialog';
import { goTo } from '../navigation';
import { usePref } from '../preferenceshooks';
import { ResourceView } from '../resourceview';
import { useCachedState } from '../statecache';

const url = cachableUrl('/static/config/querybuilder.xml');
const fetchTablesToShow = f.store(
  async (): Promise<RA<keyof Tables>> =>
    ajax<Document>(
      url,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { headers: { Accept: 'application/xml' } }
    )
      .then(({ data: document }) =>
        f.unique(
          filterArray(
            Array.from(document.querySelectorAll('database > table'), (table) =>
              getModel(table.getAttribute('name') ?? '')
            )
          )
            .map(({ name }) => name)
            .sort()
        )
      )
      .catch((error) => {
        console.error(error);
        return [];
      })
);

const defaultSortConfig = {
  sortField: 'timestampCreated',
  ascending: false,
} as const;

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
    defaultValue: defaultSortConfig,
    staleWhileRefresh: true,
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
                className="overflow-x-auto"
              >
                <TableIcon
                  name={getModelById(query.contextTableId).name}
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
                <DataEntry.Edit onClick={(): void => handleEdit(query)} />
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
}: {
  readonly tables: RA<keyof Tables>;
}): JSX.Element {
  const [isNoRestrictionMode] = usePref(
    'queryBuilder',
    'general',
    'noRestrictionsMode'
  );
  return (
    <Ul>
      {(isNoRestrictionMode
        ? Object.keys(schema.models).filter((tableName) =>
            hasTablePermission(tableName, 'read')
          )
        : tables
      ).map((tableName, index) => (
        <li key={index}>
          <Link.Default href={`/specify/query/new/${tableName.toLowerCase()}/`}>
            <TableIcon name={tableName} tableLabel={false} />
            {defined(getModel(tableName)).label}
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
type ImportQueryState = State<'ImportQueryState'>;
type States =
  | ShowQueryListState
  | CreateQueryState
  | EditQueryState
  | ImportQueryState;

const QUERY_FETCH_LIMIT = 5000;

export function QueryToolbarItem({
  onClose: handleClose,
  getQuerySelectUrl,
  spQueryFilter,
  onNewQuery: handleNewQuery,
  isReadOnly,
}: {
  readonly onClose: () => void;
  readonly getQuerySelectUrl?: (query: SerializedResource<SpQuery>) => string;
  readonly spQueryFilter?: Partial<CollectionFetchFilters<SpQuery>>;
  readonly onNewQuery?: () => void;
  readonly isReadOnly: boolean;
}): JSX.Element | null {
  useTitle(commonText('queries'));

  const [tablesToShow] = useAsyncState(fetchTablesToShow, true);

  const [queries] = useAsyncState<RA<SerializedResource<SpQuery>>>(
    React.useCallback(
      async () =>
        fetchCollection('SpQuery', {
          limit: QUERY_FETCH_LIMIT,
          ...(spQueryFilter ?? { specifyUser: userInformation.id }),
        }).then(({ records }) => records),
      [spQueryFilter]
    ),
    true
  );

  const [state, setState] = React.useState<States>({
    type: 'ShowQueryListState',
  });

  return state.type === 'ShowQueryListState' ? (
    Array.isArray(queries) ? (
      <Dialog
        icon={<span className="text-blue-500">{icons.documentSearch}</span>}
        header={commonText('queriesDialogTitle', queries.length)}
        onClose={handleClose}
        buttons={
          <>
            <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
            {hasToolPermission('queryBuilder', 'create') && (
              <Button.Blue
                onClick={
                  handleNewQuery ??
                  ((): void =>
                    setState({
                      type: 'CreateQueryState',
                    }))
                }
              >
                {commonText('new')}
              </Button.Blue>
            )}
          </>
        }
      >
        <QueryList
          queries={queries}
          onEdit={
            isReadOnly
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
    ) : null
  ) : state.type === 'CreateQueryState' ? (
    Array.isArray(tablesToShow) ? (
      <Dialog
        icon={<span className="text-blue-500">{icons.documentSearch}</span>}
        onClose={handleClose}
        className={{
          container: dialogClassNames.narrowContainer,
        }}
        header={commonText('newQueryDialogTitle')}
        buttons={
          <>
            <Button.Transparent
              onClick={(): void => setState({ type: 'ShowQueryListState' })}
            >
              {commonText('cancel')}
            </Button.Transparent>
            {!isReadOnly && hasToolPermission('queryBuilder', 'create') ? (
              <Button.Green
                onClick={(): void => setState({ type: 'ImportQueryState' })}
              >
                {commonText('import')}
              </Button.Green>
            ) : undefined}
          </>
        }
      >
        <ListOfTables
          tables={tablesToShow.filter((tableName) =>
            hasTablePermission(tableName, 'read')
          )}
        />
      </Dialog>
    ) : (
      <LoadingScreen />
    )
  ) : state.type === 'EditQueryState' && !isReadOnly ? (
    <EditQueryDialog queryResource={state.queryModel} onClose={handleClose} />
  ) : state.type === 'ImportQueryState' ? (
    <QueryImport
      onClose={(): void => setState({ type: 'ShowQueryListState' })}
      queries={queries}
    />
  ) : (
    error('Invalid ToolbarQuery State type')
  );
}

export const menuItem: MenuItem = {
  task: 'query',
  title: commonText('queries'),
  icon: icons.documentSearch,
  isOverlay: true,
  enabled: () =>
    hasToolPermission('queryBuilder', 'read') &&
    getUserPref('header', 'menu', 'showQueries'),
  view: ({ onClose: handleClose }) => (
    <QueryToolbarItem
      onClose={handleClose}
      getQuerySelectUrl={undefined}
      isReadOnly={false}
    />
  ),
};

function EditQueryDialog({
  queryResource,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<
    'default' | 'dwcaExport' | 'reportExport' | 'labelExport' | 'report'
  >('default');

  const loading = React.useContext(LoadingContext);
  return state === 'default' ? (
    <ResourceView
      dialog="modal"
      canAddAnother={false}
      extraButtons={
        <>
          <span className="flex-1 -ml-2" />
          <Button.Green
            onClick={(): void => {
              loading(
                downloadFile(
                  `${queryResource.get('name')}.json`,
                  JSON.stringify(queryResource.toJSON(), null, '\t')
                )
              );
            }}
          >
            {commonText('export')}
          </Button.Green>
        </>
      }
      resource={queryResource}
      onSaved={(): void => goTo(`/query/${queryResource.id}/`)}
      onClose={handleClose}
      onDeleted={handleClose}
      mode="edit"
      isSubForm={false}
      isDependent={false}
    >
      {queryResource.isNew() ? undefined : (
        <div className="flex flex-col">
          <p>{commonText('actions')}</p>
          <Button.LikeLink onClick={(): void => setState('dwcaExport')}>
            {commonText('exportQueryForDwca')}
          </Button.LikeLink>
          {hasPermission('/report', 'execute') && (
            <>
              <Button.LikeLink onClick={(): void => setState('reportExport')}>
                {commonText('exportQueryAsReport')}
              </Button.LikeLink>
              <Button.LikeLink onClick={(): void => setState('labelExport')}>
                {commonText('exportQueryAsLabel')}
              </Button.LikeLink>
            </>
          )}
        </div>
      )}
    </ResourceView>
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

function QueryImport({
  onClose: handleClose,
  queries,
}: {
  readonly onClose: () => void;
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return typeof queries === 'object' ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
      header={commonText('import')}
      onClose={handleClose}
      buttons={commonText('cancel')}
    >
      <Form>
        <FilePicker
          acceptedFormats={['.json']}
          onSelected={(file): void =>
            loading(
              fileToText(file)
                .then<SerializedResource<SpQuery>>(f.unary(JSON.parse))
                .then(
                  async (query) =>
                    new schema.models.SpQuery.Resource(removeKey(query, 'id'))
                )
                .then((queryResource) =>
                  queryResource.set(
                    'name',
                    getUniqueName(
                      queryResource.get('name'),
                      queries.map(({ name }) => name),
                      defined(schema.models.SpQuery.getLiteralField('name'))
                        .length
                    )
                  )
                )
                .then(async (queryResource) => queryResource.save())
                .then((queryResource) =>
                  goTo(`/specify/query/${queryResource.id}/`)
                )
            )
          }
        />
        <Submit.Green disabled className="sr-only">
          {commonText('import')}
        </Submit.Green>
      </Form>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}

function DwcaQueryExport({
  queryResource,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [exported] = useAsyncState<string>(
    React.useCallback(
      async () =>
        ajax(`/export/extract_query/${queryResource.id}/`, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'text/plain' },
        }).then(({ data: xml }) => xml),
      [queryResource.id]
    ),
    true
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
      <AutoGrowTextArea isReadOnly value={exported} />
    </Dialog>
  ) : null;
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
  const loading = React.useContext(LoadingContext);

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
          <Submit.Blue form={id('form')}>{commonText('create')}</Submit.Blue>
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ajax<SerializedResource<SpReport>>(
              '/report_runner/create/',
              {
                method: 'POST',
                body: formData({
                  queryid: queryResource.id.toString(),
                  mimetype: asLabel ? 'jrxml/label' : 'jrxml/report',
                  name: name.trim(),
                }),
                headers: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  Accept: 'application/json',
                },
              },
              { expectedResponseCodes: [Http.CREATED] }
            )
              .then(async ({ data: reportJson }) => {
                const report = new schema.models.SpReport.Resource(reportJson);
                return report.rgetPromise('appResource');
              })
              .then((appResource) =>
                goTo(`/specify/appresources/${appResource.id}/`)
              )
          )
        }
      >
        <Input.Text
          placeholder={
            asLabel ? commonText('labelName') : commonText('reportName')
          }
          required
          value={name}
          onValueChange={(value): void => setName(value)}
        />
      </Form>
    </Dialog>
  );
}
