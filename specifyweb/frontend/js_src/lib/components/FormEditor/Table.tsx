import React from 'react';
import { useOutletContext } from 'react-router';

import type { FormEditorOutlet } from './index';
import { getTable } from '../DataModel/tables';
import { NotFoundView } from '../Router/NotFoundView';
import { useParams } from 'react-router-dom';

export function FormEditorTable(): JSX.Element {
  const { tableName = '' } = useParams();
  const table = getTable(tableName);
  const {
    viewSets: [viewSets],
  } = useOutletContext<FormEditorOutlet>();
  return table === undefined ? (
    <NotFoundView />
  ) : (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4 className="text-xl">{table.label}</h4>
    </div>
  );
}
