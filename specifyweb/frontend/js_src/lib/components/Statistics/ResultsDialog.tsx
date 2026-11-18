import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import type { QueryFieldWithPath, QuerySpec } from './types';

const addPath = (
  fields: RA<SerializedResource<SpQueryField>>
): RA<QueryFieldWithPath> =>
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
  searchSynonymy: query.searchSynonymy,
});

export function FrontEndStatsResultDialog({
  query: originalQuery,
  onClose: handleClose,
  label,
  showClone,
  onEdit: handleEdit,
  onClone: handleClone,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly label: string;
  readonly showClone: boolean;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
  readonly onClone: ((querySpec: QuerySpec) => void) | undefined;
}): JSX.Element | null {
  const [query, setQuery] = useLiveState(
    React.useCallback(
      () => queryToSpec(serializeResource(originalQuery)),
      [originalQuery]
    )
  );
  const isDisabled = query.fields.length === 0 || handleEdit === undefined;

  return (
    <Dialog
      buttons={
        <div className="flex flex-1 gap-2">
          {showClone && (
            <Button.Secondary
              disabled={handleClone === undefined}
              onClick={(): void => {
                handleClone?.(query);
                handleClose();
              }}
            >
              {formsText.clone()}
            </Button.Secondary>
          )}

          <span className="-ml-2 flex-1" />

          <Button.DialogClose>{commonText.close()}</Button.DialogClose>

          {typeof handleEdit === 'function' && (
            <Button.Save
              disabled={isDisabled}
              onClick={(): void => {
                handleEdit(query);
                handleClose();
              }}
            >
              {commonText.save()}
            </Button.Save>
          )}
        </div>
      }
      className={{
        container: dialogClassNames.wideContainer,
      }}
      dimensionsKey="QueryBuilder"
      header={label as LocalizedString}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun={showClone}
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
                  isDistinct,
                })
            : undefined
        }
      />
    </Dialog>
  );
}
