import React from 'react';

import { treeText } from '../../localization/tree';
import type { RA, ValueOf } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { FormField } from '../FormFields';
import { strictDependentFields } from '../FormMeta/CarryForward';
import type { FieldTypes } from '../FormParse/fields';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { resourceToGeneric } from './autoMerge';
import { MergeSubviewButton } from './CompareSubView';
import { MergeRow } from './Header';

export function CompareField({
  field,
  resources,
  merged,
}: {
  readonly field: LiteralField | Relationship;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
}): JSX.Element {
  return (
    <MergeRow header={field.label}>
      <Field
        field={field}
        isReadOnly={false}
        merged={undefined}
        resource={merged}
        resources={resources}
      />
      {resources.map((resource, index) => (
        <Field
          field={field}
          isReadOnly
          key={index}
          merged={merged}
          resource={resource}
          resources={resources}
        />
      ))}
    </MergeRow>
  );
}

function Field({
  field,
  resource,
  resources,
  merged,
  isReadOnly,
}: {
  readonly field: LiteralField | Relationship;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const fieldDefinition = React.useMemo(
    () => ({
      ...fieldToDefinition(field),
      isReadOnly: false,
    }),
    [field]
  );
  return resource === undefined ? (
    <td />
  ) : (
    <td className="!items-stretch">
      {typeof merged === 'object' && (
        <MergeButton field={field} from={resource} to={merged} />
      )}
      {!field.isRelationship ||
      (!field.isDependent() && !relationshipIsToMany(field)) ? (
        <div className="flex flex-1 items-center justify-center">
          <FormField
            fieldDefinition={fieldDefinition}
            fieldName={field.name}
            /*
             * Don't use auto grow text area, but do display query combo box
             * controls. Also, display precision picker
             */
            formType={
              field.isRelationship ||
              (fieldDefinition.type === 'Plugin' &&
                fieldDefinition.pluginDefinition.type === 'PartialDateUI')
                ? 'form'
                : 'formTable'
            }
            id={undefined}
            isRequired={false}
            mode={isReadOnly || typeof merged === 'object' ? 'view' : 'edit'}
            resource={resource}
          />
        </div>
      ) : (
        <MergeSubviewButton
          merged={merged}
          relationship={field}
          resource={resource}
          resources={resources}
        />
      )}
    </td>
  );
}

function fieldToDefinition(
  field: LiteralField | Relationship
): ValueOf<FieldTypes> {
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
  else if (field.isTemporal())
    return {
      type: 'Plugin',
      pluginDefinition: {
        type: 'PartialDateUI',
        defaultValue: undefined,
        dateField: field.name,
        precisionField: Object.entries(strictDependentFields()).find(
          ([_dependent, source]) => source === field.name
        )?.[0],
        defaultPrecision: 'full',
      },
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

export function MergeButton({
  field,
  from,
  to,
}: {
  readonly field: LiteralField | Relationship | undefined;
  readonly from: SpecifyResource<AnySchema>;
  readonly to: SpecifyResource<AnySchema>;
}): JSX.Element {
  const getValue = React.useCallback(
    (record: SpecifyResource<AnySchema>) =>
      field === undefined
        ? resourceToGeneric(serializeResource(record), true)
        : record.get(field.name),
    [field]
  );

  const [fromValue, setFromValue] = React.useState(() => getValue(from));
  React.useEffect(
    () => resourceOn(from, 'changed', () => setFromValue(getValue(from)), true),
    [from, field]
  );

  const [toValue, setToValue] = React.useState(() => getValue(to));
  React.useEffect(
    () => resourceOn(to, 'changed', () => setToValue(getValue(to)), true),
    [to, field]
  );

  const isSame = React.useMemo(
    () => JSON.stringify(fromValue) === JSON.stringify(toValue),
    [fromValue, toValue]
  );
  return (
    <Button.Small
      aria-label={treeText.merge()}
      disabled={isSame}
      title={treeText.merge()}
      variant={className.blueButton}
      onClick={(): void => {
        if (field === undefined)
          to.bulkSet(resourceToGeneric(serializeResource(from), false));
        else {
          const dependentFields = Object.entries(strictDependentFields())
            .filter(([_dependent, source]) => source === field.name)
            .map(([dependent]) => dependent);
          const allFields = [field.name, ...dependentFields];
          allFields.forEach((fieldName) =>
            to.set(fieldName, from.get(fieldName))
          );
        }
      }}
    >
      {icons.chevronLeft}
    </Button.Small>
  );
}
