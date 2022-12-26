import React from 'react';

import { deserializeResource } from '../../hooks/resource';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form, Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { specialFields } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { FormField } from '../FormFields';
import type { FieldTypes } from '../FormParse/fields';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { autoMerge } from './autoMerge';
import { MergeRow, MergingHeader } from './Header';

export function CompareRecords({
  showMatching,
  formId,
  model,
  records,
  onMerge: handleMerge,
  onDeleted: handleDeleted,
}: {
  readonly showMatching: boolean;
  readonly formId: string;
  readonly model: SpecifyModel;
  readonly records: RA<SerializedResource<AnySchema>>;
  readonly onMerge: (
    merged: SpecifyResource<AnySchema>,
    resources: RA<SpecifyResource<AnySchema>>
  ) => void;
  readonly onDeleted: (id: number) => void;
}): JSX.Element {
  const merged = React.useMemo(
    () => deserializeResource(autoMerge(model, records)),
    [model, records]
  );
  const resources = React.useMemo(
    () => records.map(deserializeResource),
    [records]
  );
  const conformation = useConformation(showMatching, model, records);
  return (
    <Form
      id={formId}
      onSubmit={(): void => handleMerge(merged, resources)}
      className="overflow-hidden"
    >
      <table
        className={`
          grid-table grid-cols-[auto,repeat(var(--columns),minmax(15rem,1fr))]
          gap-2 overflow-auto
        `}
        style={
          {
            '--columns': records.length + 1,
          } as React.CSSProperties
        }
      >
        <MergingHeader
          merged={merged}
          resources={resources}
          onDeleted={handleDeleted}
        />
        {/* FIXME: add an all-left and all-right button */}
        {/* FIXME: add merge util to user tools */}
        {/* FIXME: add merge util to form meta */}
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
      </table>
    </Form>
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
  resources,
  merged,
}: {
  readonly field: LiteralField | Relationship;
  readonly resources: RA<SpecifyResource<AnySchema>>;
  readonly merged: SpecifyResource<AnySchema>;
}): JSX.Element {
  return (
    <MergeRow header={field.label}>
      <Field field={field} merged={undefined} resource={merged} />
      {resources.map((resource, index) => (
        <Field field={field} key={index} merged={merged} resource={resource} />
      ))}
    </MergeRow>
  );
}

function MergeButton({
  field,
  from,
  to: merged,
}: {
  readonly field: LiteralField | Relationship;
  readonly from: SpecifyResource<AnySchema>;
  readonly to: SpecifyResource<AnySchema>;
}): JSX.Element {
  const fromValue = from.get(field.name);

  const [toValue, setToValue] = React.useState(merged.get(field.name));
  React.useEffect(
    () =>
      resourceOn(
        merged,
        `change:${field.name}`,
        () => setToValue(merged.get(field.name)),
        true
      ),
    [toValue, field.name]
  );

  const isSame = React.useMemo(
    () => JSON.stringify(fromValue) === JSON.stringify(toValue),
    [fromValue, toValue]
  );
  return (
    <Button.Small
      aria-label={treeText('merge')}
      disabled={isSame}
      title={treeText('merge')}
      variant={className.blueButton}
      onClick={(): void => void merged.set(field.name, fromValue)}
    >
      {icons.chevronLeft}
    </Button.Small>
  );
}

function Field({
  field,
  resource,
  merged,
}: {
  readonly field: LiteralField | Relationship;
  readonly resource: SpecifyResource<AnySchema>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
}): JSX.Element {
  const fieldDefinition = React.useMemo(
    () => ({
      ...fieldToDefinition(field),
      isReadOnly: false,
    }),
    [field]
  );
  return (
    <td>
      {typeof merged === 'object' && (
        <MergeButton field={field} from={resource} to={merged} />
      )}
      {!field.isRelationship ||
      (!field.isDependent() && !relationshipIsToMany(field)) ? (
        <div className="flex-1">
          <FormField
            fieldDefinition={fieldDefinition}
            fieldName={field.name}
            formType="form"
            id={undefined}
            isRequired={false}
            mode={merged === undefined ? 'edit' : 'view'}
            resource={resource}
          />
        </div>
      ) : (
        <Input.Text
          // FIXME: render this as a subview
          value={JSON.stringify(resource.get(field.name))}
          onChange={undefined}
        />
      )}
    </td>
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
