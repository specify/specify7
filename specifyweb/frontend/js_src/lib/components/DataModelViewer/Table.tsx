import React from 'react';

import { schemaText } from '../../localization/schema';
import { H2 } from '../Atoms';
import { Link } from '../Atoms/Link';
import { getModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { DataModelFields } from './Fields';
import { DataModelRelationships } from './Relationships';
import { topId } from './Viewer';

export function DataModelTable({
  tableName,
  forwardRef,
}: {
  readonly tableName: keyof Tables;
  readonly forwardRef?: (element: HTMLElement | null) => void;
}): JSX.Element {
  const model = getModel(tableName);
  return model === undefined ? (
    <NotFoundView />
  ) : (
    <section className="flex flex-col gap-4" ref={forwardRef}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TableIcon label={false} name={model.name} />
          <H2 className="text-2xl" id={model.name.toLowerCase()}>
            {model.name}
          </H2>
        </div>
        <Link.Default href={`#${topId}`}>{schemaText.goToTop()}</Link.Default>
      </div>
      <DataModelFields model={model} />
      <DataModelRelationships model={model} />
    </section>
  );
}
