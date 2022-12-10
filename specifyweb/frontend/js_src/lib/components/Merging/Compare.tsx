import React from 'react';

import { deserializeResource } from '../../hooks/resource';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { FormField } from '../FormFields';
import type { FieldTypes } from '../FormParse/fields';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

export function CompareRecords({
  model,
  left,
  merged,
  right,
}: {
  readonly model: SpecifyModel;
  readonly left: SerializedResource<AnySchema>;
  readonly merged: SpecifyResource<AnySchema>;
  readonly right: SerializedResource<AnySchema>;
}): JSX.Element {
  const differingFields = React.useMemo(
    () => findDiffering(model, [left, right]),
    [model, left, right]
  );
  const leftResource = React.useMemo(() => deserializeResource(left), [left]);
  const rightResource = React.useMemo(
    () => deserializeResource(right),
    [right]
  );
  return (
    <>
      {differingFields.map((field) => (
        <CompareField
          field={field}
          key={field.name}
          left={leftResource}
          merged={merged}
          right={rightResource}
        />
      ))}
    </>
  );
}

const findDiffering = (
  model: SpecifyModel,
  records: RA<SerializedResource<AnySchema>>
): RA<LiteralField | Relationship> =>
  model.fields.filter(
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
  );

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
