import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { getTable } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import { CreateFormDefinition } from './Create';
import type { FormEditorOutlet } from './index';
import type { ViewSets } from './spec';

export function FormEditorTable(): JSX.Element {
  const { tableName = '' } = useParams();
  const table = getTable(tableName);
  const {
    viewSets: [viewSets],
  } = useOutletContext<FormEditorOutlet>();
  const currentViewSets = React.useMemo(
    () => viewSets.views.filter((view) => view.table === table),
    [viewSets.views, table]
  );
  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();
  const [isUnavailable, setUnavailable] = React.useState(false);
  return table === undefined ? (
    <NotFoundView />
  ) : (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4
        className={`${className.headerPrimary} flex items-center gap-2 text-xl`}
      >
        <TableIcon label={false} name={table.name} />
        {table.label}
      </h4>
      <Link.Default href={resolveRelative(`../`)}>
        {icons.arrowLeft}
        {schemaText.tables()}
      </Link.Default>
      <Ul className="flex flex-col gap-2">
        {currentViewSets
          .filter(({ name }) => (name ?? '').length > 0)
          .map((view, index) => (
            <li key={index}>
              <Link.Default
                href={resolveRelative(`./${view.name!}`)}
                onClick={(event): void => {
                  // If there is only one view definition, don't even show this page to simplify things
                  const viewDefinitions = getViewDefinitionIndexes(
                    view,
                    viewSets.viewDefs
                  );
                  event.preventDefault();
                  if (viewDefinitions.length > 1)
                    console.warn(
                      'More than one view definition with type="form" ' +
                        'discovered for the same view. Only the first one is ' +
                        'accessible in the visual editor'
                    );
                  if (viewDefinitions.length === 0) setUnavailable(true);
                  else navigate(resolveRelative(`./${view.name!}`));
                }}
              >
                {view.name!}
              </Link.Default>
            </li>
          ))}
      </Ul>
      {isUnavailable && (
        <Dialog
          buttons={commonText.close()}
          header={resourcesText.definition()}
          onClose={(): void => setUnavailable(false)}
        >
          {resourcesText.editorNotAvailable()}
        </Dialog>
      )}
      {!isReadOnly && <CreateFormDefinition table={table} />}
    </div>
  );
}

export const getViewDefinitionIndexes = (
  view: ViewSets['views'][number] | undefined,
  viewDefs: ViewSets['viewDefs']
): RA<number> =>
  f
    .unique(view?.altViews.altViews.map(({ viewDef }) => viewDef) ?? [])
    .map((definitionName) =>
      viewDefs.findIndex(({ name }) => name === definitionName)
    )
    .filter(
      (index) =>
        /**
         * Only view definitions of type "form" contain actual view definition.
         * The "formtable" and "iconview" are always empty stubs. Thus, visual
         * editor should only show "form" view definitions
         */
        viewDefs[index]?.type === 'form'
    );
