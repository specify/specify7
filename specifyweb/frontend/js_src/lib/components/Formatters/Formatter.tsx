import React from 'react';

import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import type { GetSet, RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { FieldType } from '../WbPlanView/mappingHelpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { FormattersPickList, ResourceMapping } from './Components';
import type { Formatter } from './spec';
import { ReadOnlyContext } from '../Core/Contexts';

const allowedConditionMappings: RA<FieldType> = [
  'toOneIndependent',
  'toOneDependent',
];

export function FormatterElement({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  /*
   * FIXME: include a preview of a the results
   */
  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );
  return (
    <>
      {typeof formatter.table === 'object' && (
        <Label.Block>
          {resourcesText.conditionField()}
          <ResourceMapping
            allowedTransient={allowedConditionMappings}
            isReadOnly={isReadOnly}
            mapping={[
              formatter.definition.conditionField,
              (conditionField): void =>
                setFormatter({
                  ...formatter,
                  definition: {
                    ...formatter.definition,
                    conditionField,
                  },
                }),
            ]}
            openIndex={[openIndex, setOpenIndex]}
            table={formatter.table}
          />
        </Label.Block>
      )}
      {formatter.definition.external === undefined ? (
        <Definitions item={[formatter, setFormatter]} />
      ) : (
        <ErrorMessage>{resourcesText.editorNotAvailable()}</ErrorMessage>
      )}
    </>
  );
}

function Definitions({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element | null {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const handleChange = (fields: Formatter['definition']['fields']): void =>
    setFormatter({
      ...formatter,
      definition: {
        ...formatter.definition,
        fields,
      },
    });
  const hasCondition = formatter.definition.conditionField === undefined;
  const trimmedFields = hasCondition
    ? formatter.definition.fields.slice(0, 1)
    : formatter.definition.fields;

  const table = formatter.table;
  return table === undefined ? null : (
    <div className="flex flex-col gap-4 divide-y divide-gray-500">
      {trimmedFields.map(({ value, fields }, index) => {
        const handleChanged = (
          field: Formatter['definition']['fields'][number]
        ): void =>
          handleChange(replaceItem(formatter.definition.fields, index, field));
        return (
          <div className="flex flex-col gap-2" key={index}>
            {hasCondition && (
              <Label.Block>
                {resourcesText.condition()}
                <Input.Text
                  isReadOnly={isReadOnly}
                  value={value}
                  onValueChange={(value): void =>
                    handleChanged({
                      value,
                      fields,
                    })
                  }
                />
              </Label.Block>
            )}
            <Fields
              fields={[
                fields,
                (fields): void => handleChanged({ value, fields }),
              ]}
              table={table}
            />
          </div>
        );
      })}
      {!isReadOnly && (
        <div>
          <Button.Green
            onClick={(): void =>
              handleChange([
                ...formatter.definition.fields,
                {
                  value: undefined,
                  fields: [],
                },
              ])
            }
          >
            {resourcesText.addDefinition()}
          </Button.Green>
        </div>
      )}
    </div>
  );
}

function Fields({
  table,
  fields: [fields, setFields],
}: {
  readonly table: SpecifyTable;
  readonly fields: GetSet<Formatter['definition']['fields'][number]['fields']>;
}): JSX.Element {
  return (
    <table className="grid-table grid-cols-[1fr_auto_auto]">
      <thead>
        <tr>
          {resourcesText.separator()}
          {schemaText.field()}
          {resourcesText.formatter()}
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <Field
            field={[
              field,
              (field): void => setFields(replaceItem(fields, index, field)),
            ]}
            key={index}
            table={table}
          />
        ))}
      </tbody>
    </table>
  );
}

const allowedFieldMappings: RA<FieldType> = [
  'toOneIndependent',
  'toOneDependent',
  'toManyIndependent',
  'toManyDependent',
];

function Field({
  table,
  field: [field, handleChange],
}: {
  readonly table: SpecifyTable;
  readonly field: GetSet<
    Formatter['definition']['fields'][number]['fields'][number]
  >;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );
  return (
    <tr>
      <td>
        <Input.Text
          aria-label={resourcesText.separator()}
          value={field.separator}
          onValueChange={(separator): void =>
            handleChange({
              ...field,
              separator,
            })
          }
          isReadOnly={isReadOnly}
        />
      </td>
      <td>
        <ResourceMapping
          allowedTransient={allowedFieldMappings}
          isReadOnly={isReadOnly}
          mapping={[
            field.field,
            (fieldMapping): void =>
              handleChange({
                ...field,
                field: fieldMapping,
              }),
          ]}
          openIndex={[openIndex, setOpenIndex]}
          table={table}
        />
      </td>
      <td>
        <FieldFormatter table={table} field={[field, handleChange]} />
      </td>
    </tr>
  );
}

function FieldFormatter({
  table,
  field: [field, handleChange],
}: {
  readonly table: SpecifyTable;
  readonly field: GetSet<
    Formatter['definition']['fields'][number]['fields'][number]
  >;
}): JSX.Element | null {
  const lastField = field.field?.at(-1);
  if (lastField === undefined) return null;
  // FIXME: finish these cases
  // FIXME: output a label for each of these
  else if (!lastField.isRelationship) return null;
  else if (relationshipIsToMany(lastField))
    return (
      <Label.Inline>
        {resourcesText.aggregator()}
        <FormattersPickList
          table={table}
          type="aggregators"
          value={field.aggregator}
          onChange={(aggregator): void =>
            handleChange({
              ...field,
              aggregator,
            })
          }
        />
      </Label.Inline>
    );
  else
    return (
      <Label.Inline>
        {resourcesText.formatter()}
        <FormattersPickList
          table={table}
          type="formatters"
          value={field.formatter}
          onChange={(formatter): void =>
            handleChange({
              ...field,
              formatter,
            })
          }
        />
      </Label.Inline>
    );
}
