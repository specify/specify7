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
import { RA } from '../../utils/types';
import { SpQueryField } from '../DataModel/types';

const addPath = (
  fields: RA<SerializedResource<SpQueryField>>
): RA<Partial<SerializedResource<SpQueryField>> & { readonly path: string }> =>
  fields.map((field) => ({
    ...field,
    path: QueryFieldSpec.fromStringId(field.stringId, field.isRelFld ?? false)
      .toMappingPath()
      .join('.'),
  }));
export const queryToSpec = (query: SerializedResource<SpQuery>): QuerySpec => ({
  tableName: query.contextName as keyof Tables,
  fields: addPath(query.fields),
  isDistinct: query.selectDistinct,
});

export function FrontEndStatsResultDialog({
  query: originalQuery,
  onClose: handleClose,
  label,
  onEdit: handleEdit,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly label: string;
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
      header={label}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun
        forceCollection={undefined}
        isEmbedded
        query={originalQuery}
        recordSet={undefined}
        onChange={
          typeof handleEdit === 'function'
            ? ({ fields, isDistinct }): void =>
                setQuery({
                  tableName: query.tableName,
                  fields: addPath(fields),
                  isDistinct: isDistinct,
                })
            : undefined
        }
      />
    </Dialog>
  );
}
