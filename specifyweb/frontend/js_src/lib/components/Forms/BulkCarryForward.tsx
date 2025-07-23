import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { ajax } from '../../utils/ajax';
import { keysToLowerCase } from '../../utils/utils';
import {
  formatterToParser,
  getValidationAttributes,
} from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { AnySchema, SerializedRecord } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import type { LiteralField } from '../DataModel/specifyField';
import { tableValidForBulkClone } from '../FormMeta/CarryForward';
import { Dialog } from '../Molecules/Dialog';
import { Input, Label } from '../Atoms/Form';
import { tables } from '../DataModel/tables';

export type BulkCarryRangeError =
  | boolean
  | 'ExistingNumbers'
  | 'InvalidRange'
  | 'LimitExceeded';

const bulkCarryLimit = 500;

export function useBulkCarryForward<SCHEMA extends AnySchema = AnySchema>({
  resource,
  showBulkCarryCount,
  showBulkCarryRange,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly showBulkCarryCount: boolean;
  readonly showBulkCarryRange: boolean;
}): {
  readonly BulkCarryForward: JSX.Element | null;
  readonly handleBulkCarryForward:
    | undefined
    | (() => Promise<RA<SpecifyResource<SCHEMA>> | undefined>);
  readonly dialogs: JSX.Element | null;
} {
  // Disable bulk carry forward for COType cat num format that are undefined or one of types listed in tableValidForBulkClone()
  const disableBulk =
    !tableValidForBulkClone(resource.specifyTable, resource) ||
    resource.specifyTable.name !== 'CollectionObject';

  const field = tables.CollectionObject.strictGetLiteralField('catalogNumber');

  const bulkCarryForwardRange = useBulkCarryForwardRange(resource, field);

  const bulkCarryForwardCount = useBulkCarryForwardCount(resource, field);

  const bulkCarryForward = showBulkCarryRange
    ? bulkCarryForwardRange
    : showBulkCarryCount
      ? bulkCarryForwardCount
      : undefined;

  return disableBulk || bulkCarryForward === undefined
    ? {
        BulkCarryForward: null,
        handleBulkCarryForward: undefined,
        dialogs: null,
      }
    : bulkCarryForward;
}

function useBulkCarryForwardRange<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>,
  field: LiteralField
): ReturnType<typeof useBulkCarryForward> | undefined {
  const formatter = field.getUiFormatter(resource);
  const canAutoNumberFormatter = formatter?.canAutoIncrement() ?? false;
  const parser =
    formatter === undefined ? undefined : formatterToParser(field, formatter);

  const [carryForwardRangeEnd, setCarryForwardRangeEnd] =
    React.useState<string>('');

  const [bulkCarryRangeBlocked, setBulkCarryRangeBlocked] =
    React.useState<BulkCarryRangeError>(false);
  const [bulkCarryRangeInvalidNumbers, setBulkCarryRangeInvalidNumbers] =
    React.useState<RA<string> | undefined>(undefined);

  const handleBulkCarryForward =
    typeof formatter === 'object'
      ? async (): Promise<RA<SpecifyResource<SCHEMA>> | undefined> => {
          const carryForwardRangeStart = resource.get(field.name);
          if (
            carryForwardRangeStart === null ||
            !formatter.format(carryForwardRangeStart) ||
            !formatter.format(carryForwardRangeEnd) ||
            (formatter.format(carryForwardRangeStart) ?? '') >=
              (formatter.format(carryForwardRangeEnd) ?? '')
          ) {
            setBulkCarryRangeBlocked('InvalidRange');
            return undefined;
          }
          const response = await ajax<{
            readonly values: RA<string>;
            readonly existing?: RA<string>;
            readonly error?: string;
          }>(`/api/specify/series_autonumber_range/`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: keysToLowerCase({
              rangeStart: carryForwardRangeStart,
              rangeEnd: carryForwardRangeEnd,
              tableName: resource.specifyTable.name.toLowerCase(),
              fieldName: field.name.toLowerCase(),
              formatterName: formatter.name,
              skipStartNumber: true,
            }),
            errorMode: 'dismissible',
          })
            .then(({ data }) => {
              if (data.error !== undefined) {
                setBulkCarryRangeBlocked(data.error as BulkCarryRangeError);
                if (data.existing !== undefined) {
                  setBulkCarryRangeInvalidNumbers(data.existing);
                }
              }
              return data.values;
            })
            .catch((error) => {
              console.error(error);
              return false as const;
            });

          if (!Array.isArray(response)) {
            setBulkCarryRangeBlocked(true);
            return undefined;
          }

          const clones = await Promise.all(
            response.map(async (value) => {
              const clonedResource = await resource.clone(false, true);
              clonedResource.set(field.name, value as never);
              return clonedResource;
            })
          );

          const backendClones = await ajax<RA<SerializedRecord<SCHEMA>>>(
            `/api/specify/bulk/${resource.specifyTable.name.toLowerCase()}/`,
            {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: clones,
            }
          ).then(({ data }) =>
            data.map((resource) =>
              deserializeResource(serializeResource(resource))
            )
          );

          return Promise.all([resource, ...backendClones]);
        }
      : undefined;

  const BulkCarryForward =
    canAutoNumberFormatter &&
    typeof formatter === 'object' &&
    typeof parser === 'object' ? (
      <Label.Inline>
        <Input.Text
          aria-label={formsText.bulkCarryForwardRangeStart()}
          className="!w-fit"
          isReadOnly
          placeholder={formatter.valueOrWild()}
          value={resource.get('catalogNumber') ?? ''}
          width={field.datamodelDefinition.length}
        />
        <Input.Text
          aria-label={formsText.bulkCarryForwardRangeEnd()}
          className="!w-fit"
          {...getValidationAttributes(parser)}
          placeholder={formatter.valueOrWild()}
          value={carryForwardRangeEnd}
          onValueChange={(value): void => setCarryForwardRangeEnd(value)}
        />
      </Label.Inline>
    ) : undefined;

  const dialogs =
    bulkCarryRangeBlocked !== false ? (
      <BulkCarryRangeBlockedDialog
        error={bulkCarryRangeBlocked}
        invalidNumbers={bulkCarryRangeInvalidNumbers}
        numberField={field}
        onClose={(): void => {
          setBulkCarryRangeBlocked(false);
          setBulkCarryRangeInvalidNumbers(undefined);
        }}
      />
    ) : null;

  return BulkCarryForward === undefined
    ? undefined
    : {
        BulkCarryForward,
        handleBulkCarryForward,
        dialogs,
      };
}

function useBulkCarryForwardCount<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>,
  field: LiteralField
): ReturnType<typeof useBulkCarryForward> | undefined {
  const [carryForwardAmount, setCarryForwardAmount] = React.useState<number>(1);

  const formatter = field.getUiFormatter(resource);

  const handleBulkCarryForward =
    formatter === undefined || carryForwardAmount <= 1
      ? undefined
      : async (): Promise<RA<SpecifyResource<SCHEMA>> | undefined> => {
          const clones = await Promise.all(
            Array.from({ length: carryForwardAmount }, async () => {
              const clonedResource = await resource.clone(false, true);
              clonedResource.set(field.name, formatter.valueOrWild() as never);
              return clonedResource;
            })
          );

          return ajax<RA<SerializedRecord<SCHEMA>>>(
            `/api/specify/bulk/${resource.specifyTable.name.toLowerCase()}/`,
            {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: clones,
            }
          ).then(({ data }) => [
            resource,
            ...data.map((clone) =>
              deserializeResource(serializeResource(clone))
            ),
          ]);
        };

  const BulkCarryForward = (
    <Input.Integer
      aria-label={formsText.bulkCarryForwardCount()}
      className="!w-fit"
      max={5000}
      min={1}
      placeholder="1"
      value={carryForwardAmount}
      onValueChange={(value): void => setCarryForwardAmount(Number(value))}
    />
  );
  return BulkCarryForward === undefined
    ? undefined
    : {
        BulkCarryForward,
        handleBulkCarryForward,
        dialogs: null,
      };
}

export function BulkCarryRangeBlockedDialog({
  error,
  invalidNumbers,
  numberField,
  onClose: handleClose,
}: {
  readonly error: BulkCarryRangeError;
  readonly invalidNumbers: RA<string> | undefined;
  readonly numberField: LiteralField;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <Button.Warning onClick={handleClose}>
          {commonText.close()}
        </Button.Warning>
      }
      header={formsText.carryForward()}
      onClose={undefined}
    >
      {error == 'ExistingNumbers' ? (
        <>
          {formsText.bulkCarryForwardRangeExistingRecords({
            field: numberField.label,
          })}
          {invalidNumbers &&
            invalidNumbers.map((number, index) => <p key={index}>{number}</p>)}
        </>
      ) : error === 'LimitExceeded' ? (
        <>
          {formsText.bulkCarryForwardRangeLimitExceeded({
            limit: bulkCarryLimit,
          })}
        </>
      ) : (
        <>
          {formsText.bulkCarryForwardRangeErrorDescription({
            field: numberField.label,
          })}
        </>
      )}
    </Dialog>
  );
}
