import React from 'react';

import { QueryBuilder } from '../QueryBuilder/Wrapped';

import { SpQuery, SpQueryField, Tables } from '../DataModel/types';

import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { RA } from '../../utils/types';
import { SerializedResource } from '../DataModel/helperTypes';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';

export function FrontEndStatsResultDialog({
  query,
  onClose: handleClose,
  statLabel,
  onSpecChanged: handleSpecChange,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly statLabel: string;
  readonly onSpecChanged:
    | ((
        tableName: keyof Tables,
        fields: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      ) => void)
    | undefined;
}): JSX.Element | null {
  const [queryData, setQueryData] = React.useState<{
    readonly tableName: keyof Tables | undefined;
    readonly fields:
      | undefined
      | RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >;
  }>({ tableName: undefined, fields: undefined });
  return typeof query === 'object' ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          {typeof handleSpecChange === 'function' &&
          queryData.fields !== undefined &&
          queryData.tableName !== undefined ? (
            <Button.Green
              onClick={(): void => {
                if (
                  queryData.tableName !== undefined &&
                  queryData.fields !== undefined
                ) {
                  handleSpecChange(queryData.tableName, queryData.fields);
                  handleClose();
                }
              }}
            >
              {commonText('save')}
            </Button.Green>
          ) : null}
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
        isEmbedded
        isReadOnly={false}
        query={query}
        recordSet={undefined}
        forceCollection={undefined}
        onFieldModify={
          typeof handleSpecChange === 'function'
            ? (tableName, fields): void => {
                setQueryData({
                  tableName: tableName,
                  fields: fields.map((field) => ({
                    ...field,
                    path: QueryFieldSpec.fromStringId(
                      field.stringId,
                      field.isRelFld ?? false
                    )
                      .toMappingPath()
                      .join('.'),
                  })),
                });
              }
            : undefined
        }
      />
    </Dialog>
  ) : null;
}
