import React from 'react';

import { QueryBuilder } from '../QueryBuilder/Wrapped';

import { SpQuery, SpQueryField } from '../DataModel/types';

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
        itemSpec: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      ) => void)
    | undefined;
}): JSX.Element | null {
  const [newFields, setNewFields] = React.useState<
    | RA<Partial<SerializedResource<SpQueryField>> & { readonly path: string }>
    | undefined
  >(undefined);
  return typeof query === 'object' ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          {typeof handleSpecChange === 'function' && newFields !== undefined ? (
            <Button.Green
              onClick={(): void => {
                handleSpecChange(newFields);
                handleClose();
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
            ? (fields): void => {
                setNewFields(
                  fields.map((field) => ({
                    ...field,
                    path: QueryFieldSpec.fromStringId(
                      field.stringId,
                      field.isRelFld ?? false
                    )
                      .toMappingPath()
                      .join('.'),
                  }))
                );
              }
            : undefined
        }
      />
    </Dialog>
  ) : null;
}
