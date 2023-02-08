import React from 'react';

import { useCachedState } from '../../hooks/useCachedState';
import type { RA } from '../../utils/types';
import { Form } from '../Atoms/Form';
import { deserializeResource, specialFields } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { strictDependentFields } from '../FormMeta/CarryForward';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { CompareField } from './CompareField';
import { MergingHeader } from './Header';

export function CompareRecords({
  formId,
  model,
  records,
  merged,
  onMerge: handleMerge,
  onDismiss: handleDismiss,
}: {
  readonly formId: string;
  readonly model: SpecifyModel;
  readonly records: RA<SerializedResource<AnySchema>>;
  readonly merged: SpecifyResource<AnySchema>;
  readonly onMerge: (
    merged: SpecifyResource<AnySchema>,
    resources: RA<SpecifyResource<AnySchema>>
  ) => void;
  readonly onDismiss: (id: number) => void;
}): JSX.Element {
  const resources = React.useMemo(
    () => records.map(deserializeResource),
    [records]
  );
  const conformation = useMergeConformation(model, resources);
  return (
    <MergeContainer
      id={formId}
      recordCount={records.length}
      onSubmit={(): void => handleMerge(merged, resources)}
    >
      <MergingHeader
        merged={merged}
        resources={resources}
        onDismiss={handleDismiss}
      />
      <tbody>
        {conformation.map((field) => (
          <CompareField
            field={field}
            key={field.name}
            merged={merged}
            resources={resources}
          />
        ))}
      </tbody>
    </MergeContainer>
  );
}

export function MergeContainer({
  id,
  recordCount,
  children,
  onSubmit: handleSubmit,
}: {
  readonly id: string;
  readonly recordCount: number;
  readonly children: React.ReactNode;
  readonly onSubmit: () => void;
}): JSX.Element {
  return (
    <Form className="overflow-hidden" id={id} onSubmit={handleSubmit}>
      <table
        className={`
          grid-table
          grid-cols-[auto,repeat(var(--columns),minmax(15rem,1fr))]
          overflow-auto
          [&_:is(th,td)]:p-1
          [&_:is(td,th):nth-child(2)]:mr-1
          [&_:is(td,th):nth-child(2)]:border-r
          [&_:is(td,th):nth-child(2)]:border-gray-500
          [&_:is(td,th):nth-child(2)]:pr-2
        `}
        style={
          {
            '--columns': recordCount + 1,
          } as React.CSSProperties
        }
      >
        {children}
      </table>
    </Form>
  );
}

export function useMergeConformation(
  model: SpecifyModel,
  records: RA<SpecifyResource<AnySchema>>
): RA<LiteralField | Relationship> {
  const [showMatching = false] = useCachedState(
    'merging',
    'showMatchingFields'
  );
  return React.useMemo(
    () => findDiffering(showMatching, model, records),
    [showMatching, model, records]
  );
}

/**
 * Decide which fields to display in the merging dialog
 */
function findDiffering(
  showMatching: boolean,
  model: SpecifyModel,
  records: RA<SpecifyResource<AnySchema>>
): RA<LiteralField | Relationship> {
  const differing = findDifferingFields(showMatching, model, records);
  return showMatching ? differing : hideDependent(differing);
}

export const unMergeableFields = new Set([
  ...specialFields,
  /*
   * FEATURE: remove this from here to allow merging guids.
   *    This was disabled for now as back-end does not allow front-end to
   *    modify GUIDs.
   *    See https://github.com/specify/specify7/issues/2907#issuecomment-1416916477
   */
  'guid',
  'timestampCreated',
  'timestampModified',
  'version',
]);

function findDifferingFields(
  showMatching: boolean,
  model: SpecifyModel,
  records: RA<SpecifyResource<AnySchema>>
): RA<LiteralField | Relationship> {
  // Don't display independent -to-many relationships
  const fields = model.fields.filter(
    (field) =>
      !unMergeableFields.has(field.name) &&
      (!field.isRelationship ||
        field.isDependent() ||
        !relationshipIsToMany(field))
  );

  if (records.length > 0 && !showMatching) {
    const filteredFields = fields
      .filter(
        (field) =>
          new Set(
            records
              .map((record) =>
                field.isRelationship && field.isDependent()
                  ? record.getDependentResource(field.name)?.toJSON()
                  : record.get(field.name)
              )
              .map((value) =>
                value === null ||
                value === undefined ||
                (Array.isArray(value) && value.length === 0)
                  ? ''
                  : value
              )
          ).size > 1
      )
      .filter(({ name }) => !unMergeableFields.has(name));
    /*
     * Even if user said to not show matching, show matching anyway in cases
     * where doing otherwise would result in it not showing any fields at all,
     * which might be more confusing
     */
    if (filteredFields.length > 0) return filteredFields;
  }
  const nonEmptyFields = fields.filter((field) =>
    records.some((record) => {
      const value =
        field.isRelationship && field.isDependent()
          ? record.getDependentResource(field.name)
          : (record.get(field.name) as string);
      return value !== undefined && value !== null && value !== '';
    })
  );
  return nonEmptyFields.length === 0 ? fields : nonEmptyFields;
}

/**
 * If date1 is already in the list of fields, don't also include date1precision
 * as merging date1 should also merge date1precision.
 */
const hideDependent = (
  fields: RA<LiteralField | Relationship>
): RA<LiteralField | Relationship> =>
  fields.filter(({ name }) => {
    const sourceField = strictDependentFields()[name];
    return (
      sourceField === undefined ||
      !fields.some(({ name }) => name === sourceField)
    );
  });

export const exportsForTests = {
  findDiffering,
};
