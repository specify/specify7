import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { Ul } from '../Atoms';
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
                  const viewDefinitions = getViewDefinitions(
                    view,
                    viewSets.viewDefs
                  );
                  if (viewDefinitions.length === 1) {
                    event.preventDefault();
                    navigate(
                      resolveRelative(
                        `./${view.name!}/${viewDefinitions[0].name!}`
                      )
                    );
                  }
                }}
              >
                {view.name!}
              </Link.Default>
            </li>
          ))}
      </Ul>
      {!isReadOnly && <Button.Green>{commonText.create()}</Button.Green>}
    </div>
  );
}
