import React from 'react';

import { deserializeResource } from '../../hooks/resource';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { specialFields } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { FormField } from '../FormFields';
import type { FieldTypes } from '../FormParse/fields';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { autoMerge } from './autoMerge';
import { queryText } from '../../localization/query';
import { DateElement } from '../Molecules/DateElement';

// FIXME: split this file into smaller functions
export function CompareRecords({
  showMatching,
  model,
  records,
}: {
  readonly showMatching: boolean;
  readonly model: SpecifyModel;
  readonly records: RA<SerializedResource<AnySchema>>;
}): JSX.Element {
  const merged = React.useMemo(
    () => deserializeResource(autoMerge(model, records)),
    [model, records]
  );
  const resources = React.useMemo(
    () => records.map(deserializeResource),
    [records]
  );
  const left = resources[0];
  const right = resources[1];
  const conformation = useConformation(showMatching, model, records);
  return (
    <>
      <div>
        {/* FEATURE: show record usages */}
        <ResourceSummary model={model} record={records[0]} />
        {/* FEATURE: add a button to preview a given record in a form */}
      </div>
      {/* FEATURE: add an all-left and all-right button */}
      <div />
      <div>{queryText('mergedRecord')}</div>
      <div />
      <div>
        <ResourceSummary model={model} record={records[1]} />
      </div>
      {/* BUG: hide timestamp modified/created/version */}
      {/* FEATURE: look for other fields to hide - and handle their merging */}
      {/* FEATURE: allow for any number of records to merge*/}
      {/* FEATURE: freeze the first column - labels */}
      {/* FEATURE: add merge util to user tools */}
      {/* FEATURE: add merge util to form meta */}
      {conformation.map((field) => (
        <CompareField
          field={field}
          key={field.name}
          left={left}
          merged={merged}
          right={right}
        />
      ))}
    </>
  );
}

function ResourceSummary({
  record,
  model,
}: {
  readonly record: SerializedResource<AnySchema>;
  readonly model: SpecifyModel;
}): JSX.Element {
  const createdField = model.getField('timestampCreated');
  const modifiedField = model.getField('timestampModified');
  return (
    <>
      {typeof createdField === 'object' && (
        <Label.Block>
          {createdField.label}
          <DateElement date={record.timestampCreated as string} />
        </Label.Block>
      )}
      {typeof modifiedField === 'object' && (
        <Label.Block>
          {modifiedField.label}
          <DateElement date={record.timestampModified as string} />
        </Label.Block>
      )}
    </>
  );
}

function useConformation(
  showMatching: boolean,
  model: SpecifyModel,
  records: RA<SerializedResource<AnySchema>>
): RA<LiteralField | Relationship> {
  return React.useMemo(
    () => (showMatching ? model.fields : findDiffering(model, records)),
    [showMatching, model, records]
  );
}

const hiddenFields = new Set([
  ...specialFields,
  'timestampCreated',
  'timestampModified',
  'version',
]);

const findDiffering = (
  model: SpecifyModel,
  records: RA<SerializedResource<AnySchema>>
): RA<LiteralField | Relationship> =>
  model.fields
    .filter(
      (field) =>
        (!field.isRelationship ||
          field.isDependent() ||
          !relationshipIsToMany(field)) &&
        new Set(
          records
            .map((record) => record[field.name])
            .map((value) =>
              value === null ||
              value === undefined ||
              (Array.isArray(value) && value.length === 0)
                ? ''
                : value
            )
        ).size > 1
    )
    .filter(({ name }) => !hiddenFields.has(name));

function CompareField({
  field,
  left,
  merged,
  right,
}: {
  readonly field: LiteralField | Relationship;
  readonly left: SpecifyResource<AnySchema>;
  readonly merged: SpecifyResource<AnySchema>;
  readonly right: SpecifyResource<AnySchema>;
}): JSX.Element {
  return (
    <>
      <div>
        <Field field={field} isReadOnly resource={left} />
      </div>
      <MergeButton direction="right" field={field} from={left} to={merged} />
      <div>
        <Field field={field} resource={merged} />
      </div>
      <MergeButton direction="left" field={field} from={right} to={merged} />
      <div>
        <Field field={field} isReadOnly resource={right} />
      </div>
    </>
  );
}

function MergeButton({
  field,
  from,
  to: merged,
  direction,
}: {
  readonly field: LiteralField | Relationship;
  readonly from: SpecifyResource<AnySchema>;
  readonly to: SpecifyResource<AnySchema>;
  readonly direction: 'left' | 'right';
}): JSX.Element {
  const fromValue = from.get(field.name);
  const toValue = merged.get(field.name);
  const isSame = React.useMemo(
    () => JSON.stringify(fromValue) === JSON.stringify(toValue),
    [fromValue, toValue]
  );
  return (
    <Button.Blue
      aria-label={treeText('merge')}
      disabled={isSame}
      title={treeText('merge')}
      onClick={(): void => void merged.set(field.name, fromValue)}
    >
      {direction === 'left' ? icons.chevronLeft : icons.chevronRight}
    </Button.Blue>
  );
}

function Field({
  field,
  resource,
  isReadOnly = false,
}: {
  readonly field: LiteralField | Relationship;
  readonly resource: SpecifyResource<AnySchema>;
  readonly isReadOnly?: boolean;
}): JSX.Element {
  const fieldDefinition = React.useMemo(
    () => ({
      ...fieldToDefinition(field),
      isReadOnly: false,
    }),
    [field]
  );
  return (
    <Label.Block>
      {field.label}
      {!field.isRelationship || !field.isDependent() ? (
        <FormField
          fieldDefinition={fieldDefinition}
          fieldName={field.name}
          formType="form"
          id={undefined}
          isRequired={false}
          mode={isReadOnly ? 'view' : 'edit'}
          resource={resource}
        />
      ) : (
        <Input.Text
          // FIXME: render this as a subview
          value={JSON.stringify(resource.get(field.name))}
          onChange={undefined}
        />
      )}
    </Label.Block>
  );
}

function fieldToDefinition(
  field: LiteralField | Relationship
): FieldTypes[keyof FieldTypes] {
  if (field.isRelationship)
    return {
      type: 'QueryComboBox',
      hasCloneButton: false,
      typeSearch: undefined,
    };
  else if (field.type === 'java.lang.Boolean')
    return {
      type: 'Checkbox',
      defaultValue: undefined,
      label: undefined,
      printOnSave: false,
    };
  else if (field.type === 'text')
    return {
      type: 'TextArea',
      defaultValue: undefined,
      rows: undefined,
    };
  else if (typeof field.getPickList() === 'string')
    return {
      type: 'ComboBox',
      defaultValue: undefined,
      pickList: undefined,
    };
  else
    return {
      type: 'Text',
      defaultValue: undefined,
      min: undefined,
      max: undefined,
      step: undefined,
    };
}
