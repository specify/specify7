import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { getTable } from '../DataModel/tables';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import type { FormEditorOutlet } from './index';
import { getViewDefinitions } from './View';

export function FormEditorWrapper(): JSX.Element {
  const {
    tableName = '',
    viewName = '',
    viewDefinitionName = '',
  } = useParams();
  const table = getTable(tableName);
  const {
    viewSets: [viewSets, setViewSets],
  } = useOutletContext<FormEditorOutlet>();
  const view = viewSets.views.find(
    (view) => view.name === viewName && view.table === table
  );
  const viewDefinition = viewSets.viewDefs.find(
    (viewDefinition) =>
      viewDefinition.name === viewDefinitionName &&
      viewDefinition.table === table
  );

  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();

  return table === undefined ||
    view === undefined ||
    viewDefinition === undefined ? (
    <NotFoundView />
  ) : (
    <div className="flex flex-col gap-2 overflow-auto">
      <div className="flex items-center gap-2">
        <h4
          className={`${className.headerPrimary} flex items-center gap-2 text-xl`}
        >
          <TableIcon label name={table.name} />
          {viewDefinition.name}
        </h4>
        <span className="-ml-2 flex-1" />
        {!isReadOnly && (
          <Button.Red
            onClick={(): void => {
              const newView = {
                ...view,
                altViews: {
                  ...view.altViews,
                  altViews: view.altViews.altViews.filter(
                    ({ viewDef }) => viewDef !== viewDefinition.name
                  ),
                },
              };
              const newViewDefs = removeItem(
                viewSets.viewDefs,
                viewSets.viewDefs.indexOf(viewDefinition)
              );
              const remainingDefinitions = getViewDefinitions(
                newView,
                newViewDefs
              );
              const viewIndex = viewSets.views.indexOf(newView);
              setViewSets({
                ...viewSets,
                views:
                  // Remove view if there are no more view definitions
                  remainingDefinitions.length === 0
                    ? removeItem(viewSets.views, viewIndex)
                    : replaceItem(viewSets.views, viewIndex, newView),
                viewDefs: newViewDefs,
              });
              navigate(resolveRelative(`../../`));
            }}
          >
            {commonText.delete()}
          </Button.Red>
        )}
      </div>
      <Link.Default href={resolveRelative(`../../`)}>
        {icons.arrowLeft}
        {table.name}
      </Link.Default>
      <pre className="flex-1">
        {/* FIXME: handle rename. ensure name is unique */}
        {/* FIXME: show description */}
        {/* FIXME: allow editing column size definitions */}
        {/* FIXME: allow editing row size definitions */}
        {/* FIXME: allow editing business rules */}
        {/* FIXME: allow editing rows definitions */}
        {/* FIXME: show a live preview */}
        {JSON.stringify(viewDefinition.raw.children, null, 2)}
      </pre>
    </div>
  );
}
