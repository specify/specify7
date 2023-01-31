import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpQuery, Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import type { QuerySpec } from './types';

export const queryToSpec = (query: SerializedResource<SpQuery>): QuerySpec => ({
  tableName: query.contextName as keyof Tables,
  fields: query.fields.map((field) => ({
    ...field,
    path: QueryFieldSpec.fromStringId(field.stringId, field.isRelFld ?? false)
      .toMappingPath()
      .join('.'),
  })),
});

export function FrontEndStatsResultDialog({
  query: originalQuery,
  onClose: handleClose,
  statLabel,
  onEdit: handleEdit,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly statLabel: string;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
}): JSX.Element | null {
  const [query, setQuery] = useLiveState(
    React.useCallback(
      () => queryToSpec(serializeResource(originalQuery)),
      [originalQuery]
    )
  );
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          {typeof handleEdit === 'function' && (
            <Button.Green
              onClick={(): void => {
                handleEdit(query);
                handleClose();
              }}
            >
              {commonText.save()}
            </Button.Green>
          )}
        </>
      }
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={statLabel}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun
        forceCollection={undefined}
        isEmbedded
        isReadOnly={false}
        query={originalQuery}
        recordSet={undefined}
        onChange={
          typeof handleEdit === 'function'
            ? (query): void => setQuery(queryToSpec(query))
            : undefined
        }
      />
    </Dialog>
  );
}
