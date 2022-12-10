import React from 'react';

import type { GetOrSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { treeText } from '../../localization/tree';
import { icons } from '../Atoms/Icons';
import { Input, Label } from '../Atoms/Form';
import { deserializeResource } from '../../hooks/resource';
import { SpecifyResource } from '../DataModel/legacyTypes';

export function CompareRecords({
  model,
  left,
  merged,
  right,
}: {
  readonly model: SpecifyModel;
  readonly left: SerializedResource<AnySchema>;
  readonly merged: GetOrSet<SpecifyResource<AnySchema>>;
  readonly right: SerializedResource<AnySchema>;
}): JSX.Element {
  const differingFields = React.useMemo(
    () => findDiffering(model, [left, right]),
    [model, left, right]
  );
  const leftResource = React.useMemo(() => deserializeResource(left), [left]);
  const rightResource = React.useMemo(() => deserializeResource(left), [left]);
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
  readonly merged: GetOrSet<SpecifyResource<AnySchema>>;
  readonly right: SpecifyResource<AnySchema>;
}): JSX.Element {
  return (
    <>
      <div>
        <Field field={field} resource={left} onChange={undefined} />
      </div>
      <MergeButton from={left} to={merged} field={field} direction="right" />
      <div>
        <Field field={field} resource={merged[0]} onChange={merged[1]} />
      </div>
      <MergeButton from={right} to={merged} field={field} direction="left" />
      <div>
        <Field field={field} resource={right} onChange={undefined} />
      </div>
    </>
  );
}

function MergeButton({
  field,
  from,
  to,
  direction,
}: {
  readonly field: LiteralField | Relationship;
  readonly from: SpecifyResource<AnySchema>;
  readonly to: GetOrSet<SpecifyResource<AnySchema>>;
  readonly direction: 'left' | 'right';
}): JSX.Element {
  const fromValue = from.get(field.name);
  const [merged, handleChange] = to;
  const toValue = merged.get(field.name);
  const isSame = React.useMemo(
    () => JSON.stringify(fromValue) === JSON.stringify(toValue),
    [fromValue, toValue]
  );
  return (
    <Button.Blue
      disabled={isSame}
      onClick={(): void => handleChange({ ...merged, [field.name]: fromValue })}
      title={treeText('merge')}
      aria-label={treeText('merge')}
    >
      {direction === 'left' ? icons.chevronLeft : icons.chevronRight}
    </Button.Blue>
  );
}

function Field({
  field,
  resource,
  onChange: handleChange,
}: {
  readonly field: LiteralField | Relationship;
  readonly resource: SpecifyResource<AnySchema>;
  readonly onChange:
    | ((newResource: SpecifyResource<AnySchema>) => void)
    | undefined;
}): JSX.Element {
  return (
    <Label.Block>
      {field.label}
      <Input.Text
        onChange={undefined}
        value={JSON.stringify(resource.get(field.name))}
      />
    </Label.Block>
  );
}
