import Backbone from 'backbone';
import $ from 'jquery';
import React from 'react';
import type { State } from 'typesafe-reducer';

import ajax from '../../ajax';
import DeleteButton from '../../deletebutton';
import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import populateform from '../../populateform';
import SaveButton from '../../savebutton';
import schema, { getModel, getModelById } from '../../schema';
import { setCurrentView } from '../../specifyapp';
import specifyform from '../../specifyform';
import type { IR, RA } from '../../types';
import { defined } from '../../types';
import userInfo from '../../userinfo';
import { compareValues, SortIndicator, TableIcon } from '../common';
import { useTitle } from '../hooks';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { Dialog, dialogClassNames, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { useCachedState } from '../stateCache';
import { SpecifyResource } from '../../legacytypes';
import { Button, className, Link } from '../basic';

const tablesToShowPromise: Promise<RA<string>> = ajax<Document>(
  '/static/config/querybuilder.xml',
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
          (tableName !== 'spauditlog' || userInfo.usertype === 'Manager')
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
  readonly queries: RA<Query>;
  readonly onEdit?: (query: Query) => void;
  readonly getQuerySelectUrl?: (query: Query) => string;
}): JSX.Element | null {
  const [sortConfig, setSortConfig] = useCachedState({
    bucketName: 'sortConfig',
    cacheName: 'listOfQueries',
    bucketType: 'localStorage',
    defaultValue: {
      sortField: 'dateCreated',
      ascending: false,
    },
  });

  if (typeof sortConfig === 'undefined') return null;

  const queries = Array.from(unsortedQueries).sort(
    (
      { name: nameLeft, dateCreated: dateCreatedLeft },
      { name: nameRight, dateCreated: dateCreatedRight }
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
                  sortField: 'dateCreated',
                  ascending: !sortConfig.ascending,
                })
              }
            >
              {commonText('created')}
              <SortIndicator fieldName="dateCreated" sortConfig={sortConfig} />
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
                <TableIcon tableName={query.tableName} tableLabel={false} />
                {query.name}
              </Link.Default>
            </td>
            <td>
              <DateElement date={query.dateCreated} />
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
    <ul>
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
    </ul>
  );
}

export type Query = {
  readonly id: number;
  readonly name: string;
  readonly tableName: string;
  readonly dateCreated: string | undefined;
};

type ShowQueryListState = State<'ShowQueryListState'>;
type CreateQueryState = State<'CreateQueryState'>;
type States = ShowQueryListState | CreateQueryState;

const QUERY_FETCH_LIMIT = 5000;

function QueryToolbarItem({
  onClose: handleClose,
  getQueryCreateUrl,
  getQuerySelectUrl,
  onEdit: handleEdit,
  spQueryFilter,
  newQueryButtonGenerator,
}: {
  readonly onClose: () => void;
  readonly getQueryCreateUrl?: (tableName: string) => string;
  readonly getQuerySelectUrl?: (query: Query) => string;
  readonly onEdit?: (query: Query) => void;
  readonly spQueryFilter?: IR<unknown>;
  readonly newQueryButtonGenerator?: (state: States) => () => void;
}): JSX.Element {
  useTitle(commonText('queries'));

  const [tablesToShow] = useCachedState({
    bucketName: 'common',
    cacheName: 'listOfQueryTables',
    bucketType: 'sessionStorage',
    defaultValue: async () => tablesToShowPromise,
  });

  const [queries, setQueries] = React.useState<RA<Query> | undefined>(
    undefined
  );

  const [state, setState] = React.useState<States>({
    type: 'ShowQueryListState',
  });

  React.useEffect(() => {
    let destructorCalled = false;
    const queryModels = new schema.models.SpQuery.LazyCollection({
      filters: spQueryFilter ?? { specifyuser: userInfo.id },
    });
    queryModels.fetch({ limit: QUERY_FETCH_LIMIT }).done(() =>
      destructorCalled
        ? undefined
        : setQueries(
            queryModels.models.map((query) => ({
              id: query.get<number>('id'),
              name: query.get<string>('name'),
              tableName: getModelById(
                query.get<number>('contexttableid')
              ).name.toLowerCase(),
              dateCreated: query.get<string>('timestampcreated'),
            }))
          )
    );
    return (): void => {
      destructorCalled = true;
    };
  }, [spQueryFilter]);

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
          onEdit={handleEdit}
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
  else throw new Error('Invalid ToolbarQuery State type');
}

export const QueryToolbarView = createBackboneView(QueryToolbarItem);

const menuItem: MenuItem = {
  task: 'query',
  title: commonText('queries'),
  icon: '/static/img/query.png',
  view: ({ onClose }) =>
    new QueryToolbarView({
      onClose,
      getQueryCreateUrl: userInfo.isReadOnly
        ? undefined
        : (tableName: string): string => `/specify/query/new/${tableName}/`,
      getQuerySelectUrl: undefined,
      onEdit: userInfo.isReadOnly
        ? undefined
        : (query: Query): void => {
            const queryModel = new schema.models.SpQuery.LazyCollection({
              filters: { id: query.id },
            });
            queryModel.fetch({ limit: 1 }).then(() => {
              setCurrentView(
                new EditQueryDialog({
                  spquery: queryModel.models[0],
                })
              );
            });
          },
    }),
};

export default menuItem;

const EditQueryDialog = Backbone.View.extend({
  __name__: 'EditQueryDialog',
  events: {
    'click .query-export': 'exportQuery',
    'click .create-report, .create-label': 'createReport',
  },
  initialize(options: { readonly spquery: SpecifyResource }) {
    this.spquery = options.spquery;
    this.model = getModelById(this.spquery.get('contexttableid'));
  },
  render() {
    specifyform.buildViewByName('Query').done(this._render.bind(this));
    return this;
  },
  _render(form: JQuery) {
    form.find('.specify-form-header:first').remove();

    if (!this.spquery.isNew()) {
      form.append(`
        <p class="pt-2">${commonText('actions')}</p>
        <div>
          <button type="button" class="query-export link">${commonText(
            'exportQueryForDwca'
          )}</button>
          <button type="button" class="create-report link">${commonText(
            'exportQueryAsReport'
          )}</button>
          <button type="button" class="create-label link">${commonText(
            'exportQueryAsLabel'
          )}</button>
        </div>
      `);
    }

    const buttons = $(
      `<div class="${className.formFooter}" role="toolbar">`
    ).appendTo(form);

    if (!this.readOnly) {
      const saveButton = new SaveButton({ model: this.spquery });
      saveButton.render().$el.appendTo(buttons);
      saveButton.bindToForm(form[0].querySelector('form'));
      saveButton.on(
        'savecomplete',
        () => {
          this.remove();
          navigation.go(`/query/${this.spquery.id}/`);
        },
        this
      );
    }

    const label = this.spquery.specifyModel.getLocalizedName();
    const title = this.spquery.isNew()
      ? commonText('newResourceTitle')(label)
      : label;

    if (!this.spquery.isNew() && !this.readOnly) {
      const deleteButton = new DeleteButton({ model: this.spquery });
      deleteButton.render().$el.appendTo(buttons);
      deleteButton.on('deleted', () => this.remove());
    }

    populateform(form, this.spquery);

    this.$el.append(form).dialog({
      modal: true,
      width: 'auto',
      title,
      close: () => this.remove(),
    });
  },
  remove() {
    this.$el.remove();
  },
  createReport(event_: MouseEvent) {
    const isLabel = (event_.currentTarget as HTMLElement).classList.contains(
      'create-label'
    );
    const nameInput = $(`<input
        type="text"
        placeholder="${
          isLabel ? commonText('labelName') : commonText('reportName')
        }"
        size="40"
    >`);

    const createReport = (): void =>
      void ajax<IR<unknown>>('/report_runner/create/', {
        method: 'POST',
        body: {
          queryid: this.spquery.id,
          mimetype: isLabel ? 'jrxml/label' : 'jrxml/report',
          name: nameInput.val(),
        },
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Accept: 'application/json',
        },
      })
        .then(({ data: reportJson }) => {
          const report = new schema.models.SpReport.Resource(reportJson);
          return new Promise<SpecifyResource>((resolve) =>
            report.rget<SpecifyResource>('appresource').then(resolve)
          );
        })
        .then((appresource) =>
          navigation.go(`/specify/appresources/${appresource.id}/`)
        );

    $(`<div>
        ${
          isLabel
            ? commonText('createLabelDialogHeader')
            : commonText('createReportDialogHeader')
        }
    </div>`)
      .append(nameInput)
      .dialog({
        modal: true,
        width: 'auto',
        title: isLabel
          ? commonText('createLabelDialogTitle')
          : commonText('createReportDialogTitle'),
        close() {
          $(this).remove();
        },
        buttons: {
          [commonText('create')]() {
            // @ts-expect-error
            if (!nameInput.val()?.trim()) return;
            $(this).dialog('close');
            createReport();
          },
          [commonText('cancel')]() {
            $(this).dialog('close');
          },
        },
      });
  },
  exportQuery() {
    void ajax(`/export/extract_query/${this.spquery.id}/`).then(
      ({ data: xml }) => {
        const dialog = $(`<div>
                    ${commonText('exportQueryForDwcaDialogHeader')}
                    <textarea cols="120" rows="40" readonly></textarea>
                </div>`);
        $('textarea', dialog).text(xml);
        dialog.dialog({
          modal: true,
          width: 'auto',
          title: commonText('exportQueryForDwcaDialogTitle'),
          close() {
            $(this).remove();
          },
          buttons: {
            [commonText('close')]() {
              $(this).dialog('close');
            },
          },
        });
      }
    );
  },
});
