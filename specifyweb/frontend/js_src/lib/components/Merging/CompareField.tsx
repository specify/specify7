import React from 'react';

import { treeText } from '../../localization/tree';
import type { RA, ValueOf } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
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
        merged={undefined}
        resource={merged}
        resources={resources}
      />
      <ReadOnlyContext.Provider value>
        {resources.map((resource, index) => (
          <Field
            field={field}
            key={index}
            merged={merged}
            resource={resource}
            resources={resources}
          />
        ))}
      </ReadOnlyContext.Provider>
    </MergeRow>
  );
}

function Field({
  field,
  resource,
  resources,
  merged,
}: {
  readonly field: LiteralField | Relationship;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
}): JSX.Element {
  const fieldDefinition = React.useMemo(
    () => ({
      ...fieldToDefinition(field),
      isReadOnly: false,
    }),
    [field]
  );
  const fields = React.useMemo(() => [field], [field]);
  const isReadOnly = React.useContext(ReadOnlyContext);
  return resource === undefined ? (
    <td />
  ) : (
    <td className="!items-stretch">
      {typeof merged === 'object' && (
        <TransferButton field={field} from={resource} to={merged} />
      )}
      {!field.isRelationship ||
      (!field.isDependent() && !relationshipIsToMany(field)) ? (
        <div className="flex flex-1 items-center justify-center [&_textarea]:resize-y">
          <ReadOnlyContext.Provider
            value={isReadOnly || typeof merged === 'object'}
          >
            <FormField
              fieldDefinition={fieldDefinition}
              fields={fields}
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
              resource={resource}
            />
          </ReadOnlyContext.Provider>
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
  const pickList = field.getPickList();
  if (field.isRelationship)
    return {
      type: 'QueryComboBox',
      hasCloneButton: false,
      hasNewButton: true,
      hasSearchButton: true,
      hasEditButton: true,
      hasViewButton: false,
      typeSearch: undefined,
      searchView: undefined,
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
  else if (typeof pickList === 'string')
    return {
      type: 'ComboBox',
      defaultValue: undefined,
      pickList,
    };
  else if (field.isTemporal())
    return {
      type: 'Plugin',
      pluginDefinition: {
        type: 'PartialDateUI',
        defaultValue: undefined,
        dateFields: [field.name],
        precisionField: Object.entries(strictDependentFields()).find(
          ([_dependent, source]) => source === field.name
        )?.[0],
        defaultPrecision: 'full',
        canChangePrecision: true,
      },
    };
  else
    return {
      type: 'Text',
      defaultValue: undefined,
      min: undefined,
      max: undefined,
      minLength: undefined,
      maxLength: undefined,
      step: undefined,
      whiteSpaceSensitive: undefined,
    };
}

export function TransferButton({
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
      variant={className.infoButton}
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
