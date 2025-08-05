import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { ajax } from '../../utils/ajax';
import {
  formatterToParser,
  getValidationAttributes,
} from '../../utils/parser/definitions';
import type { RA, WritableArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { cogTypes } from '../DataModel/helpers';
import type { AnySchema, SerializedRecord } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { CollectionObject } from '../DataModel/types';
import { tableValidForBulkClone } from '../FormMeta/CarryForward';
import { Dialog } from '../Molecules/Dialog';

export type BulkCarryRangeError =
  | boolean
  | 'ExistingNumbers'
  | 'InvalidRange'
  | 'LimitExceeded'
  | 'UnsupportedRelationships';

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
    | (() => Promise<RA<SpecifyResource<SCHEMA>> | undefined>)
    | undefined;
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
  const [
    bulkCarryRangeUnsupportedRelationships,
    setBulkCarryRangeUnsupportedRelationships,
  ] = React.useState<RA<string> | undefined>(undefined);

  const handleBulkCarryForward =
    typeof formatter === 'object'
      ? async (): Promise<RA<SpecifyResource<SCHEMA>> | undefined> => {
          const unsupportedRelationships = [
            ...getUnsupportedRelationships(resource),
            ...(await isInConsolidatedCog(
              resource as SpecifyResource<CollectionObject>
            )),
          ];
          if (unsupportedRelationships.length > 0) {
            setBulkCarryRangeBlocked('UnsupportedRelationships');
            setBulkCarryRangeUnsupportedRelationships(unsupportedRelationships);
            return undefined;
          }
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
                return false;
              }
              return data.values;
            })
            .catch((error) => {
              console.error(error);
              setBulkCarryRangeBlocked(true);
              return false as const;
            });

          if (!Array.isArray(response)) {
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
    bulkCarryRangeBlocked === false ? null : (
      <BulkCarryRangeBlockedDialog
        error={bulkCarryRangeBlocked}
        invalidNumbers={bulkCarryRangeInvalidNumbers}
        numberField={field}
        unsupportedRelationships={bulkCarryRangeUnsupportedRelationships}
        onClose={(): void => {
          setBulkCarryRangeBlocked(false);
          setBulkCarryRangeInvalidNumbers(undefined);
          setBulkCarryRangeUnsupportedRelationships(undefined);
        }}
      />
    );

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

  const BulkCarryForward =
    formatter === undefined ? undefined : (
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
  unsupportedRelationships,
  numberField,
  onClose: handleClose,
}: {
  readonly error: BulkCarryRangeError;
  readonly invalidNumbers: RA<string> | undefined;
  readonly unsupportedRelationships: RA<string> | undefined;
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
      {error === 'ExistingNumbers' ? (
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
      ) : error === 'UnsupportedRelationships' ? (
        <>
          {formsText.bulkCarryForwardRangeUnsupportedRelationships()}
          {unsupportedRelationships &&
            unsupportedRelationships.map((relationship, index) => (
              <p key={index}>{relationship}</p>
            ))}
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

/*
 * Temporary fix for https://github.com/specify/specify7/issues/5022.
 * REFACTOR: Remove this once issue #5022 is fixed.
 */
function getUnsupportedRelationships<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): RA<string> {
  const unsupported: WritableArray<string> = [];

  const table = resource.specifyTable;
  const unsupportedRelationships = new Set([
    'determinations',
    'determiners',
    'fundingagents',
    'collectors',
    'addresses',
  ]);

  function isCollection(object: unknown): object is Collection<SCHEMA> {
    return (
      Boolean(object) &&
      typeof object === 'object' &&
      object !== null &&
      'models' in object &&
      'length' in object
    );
  }

  function recursiveRelationshipCheck(
    related: SpecifyResource<SCHEMA>,
    relationship: Relationship
  ): void {
    const relatedUnsupported = getUnsupportedRelationships(related);
    relatedUnsupported.forEach((relatedRelationship) => {
      unsupported.push(`${relationship.label} > ${relatedRelationship}`);
    });
  }

  table.relationships.forEach((relationship): void => {
    if (relationship.isDependent()) {
      const relatedTable = relationship.relatedTable;
      const relatedHasUnsupportedRelationships =
        relatedTable.relationships.some((relatedRelationship: Relationship) =>
          unsupportedRelationships.has(relatedRelationship.name)
        );
      // Relationship contains unsupported relationships within, check recursively.
      if (relatedHasUnsupportedRelationships) {
        const related = resource.getDependentResource(relationship.name);
        if (related !== null && related !== undefined) {
          if (isCollection(related)) {
            related.models.forEach((model) =>
              recursiveRelationshipCheck(model, relationship)
            );
          } else {
            recursiveRelationshipCheck(related, relationship);
          }
        }
      }

      // This unsupported relationship cannot have more than two related records
      if (unsupportedRelationships.has(relationship.name)) {
        const related = resource.getDependentResource(relationship.name);
        if (
          related !== undefined &&
          isCollection(related) &&
          related.length > 1
        ) {
          unsupported.push(relationship.label);
        }
      }
    }
  });

  return unsupported;
}
/*
 * Consolidated COGs aren't supported.
 * REFACTOR: Remove this once issue #5022 is fixed.
 */
async function isInConsolidatedCog(
  resource: SpecifyResource<CollectionObject>
): Promise<RA<string>> {
  const cojo = resource.getDependentResource('cojo');
  if (cojo !== null && cojo !== undefined) {
    const parentCog = await cojo.rgetPromise('parentCog');
    const cogType = await parentCog.rgetPromise('cogType');
    if (cogType.get('type') === cogTypes.CONSOLIDATED) {
      // Return 'Consolidated Collection Object Group' as error.
      return [`${cogTypes.CONSOLIDATED} ${parentCog.specifyTable.label}`];
    }
  }
  return [];
}
