import React from 'react';
import { useOutletContext } from 'react-router';
import { useParams } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { ErrorMessage, Ul } from '../Atoms';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { getTable } from '../DataModel/tables';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import type { FormEditorOutlet } from './index';
import type { ViewSets } from './spec';

export function FormEditorView(): JSX.Element {
  const { tableName = '', viewName = '' } = useParams();
  const table = getTable(tableName);
  const {
    viewSets: [viewSets],
  } = useOutletContext<FormEditorOutlet>();
  const view = React.useMemo(
    () =>
      viewSets.views.find(
        (view) => view.name === viewName && view.table === table
      ),
    [viewSets.views, table]
  );
  const viewDefinitions = React.useMemo(
    () => getViewDefinitions(view, viewSets.viewDefs),
    [view, viewSets.viewDefs]
  );

  return table === undefined || view === undefined ? (
    <NotFoundView />
  ) : (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4
        className={`${className.headerPrimary} flex items-center gap-2 text-xl`}
      >
        <TableIcon label name={table.name} />
        {view.name}
      </h4>
      <Link.Default href={resolveRelative(`../`)}>
        {icons.arrowLeft}
        {table.name}
      </Link.Default>
      {viewDefinitions.length === 0 ? (
        <ErrorMessage>{resourcesText.editorNotAvailable()}</ErrorMessage>
      ) : (
        <Ul className="flex flex-col gap-2">
          {viewDefinitions
            .filter(({ name }) => (name ?? '').length > 0)
            .map(({ name = '' }, index) => (
              <li key={index}>
                <Link.Default href={resolveRelative(`./${name}`)}>
                  {name}
                </Link.Default>
              </li>
            ))}
        </Ul>
      )}
    </div>
  );
}

export const getViewDefinitions = (
  view: ViewSets['views'][number] | undefined,
  viewDefs: ViewSets['viewDefs']
) =>
  filterArray(
    f
      .unique(view?.altViews.altViews.map(({ viewDef }) => viewDef) ?? [])
      .map((definitionName) =>
        viewDefs.find(({ name }) => name === definitionName)
      )
  ).filter(
    ({ raw }) =>
      /**
       * Only view definitions of type "form" contain actual view definition.
       * The "formtable" and "iconview" are always empty stubs. Thus, visual
       * editor should only show "form" view definitions
       */
      raw.attributes.type === 'form'
  );
