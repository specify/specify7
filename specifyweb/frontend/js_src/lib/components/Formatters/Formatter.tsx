import React from 'react';

import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import type { GetSet } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import {
  FieldFormattersPickList,
  FormattersPickList,
  ResourceMapping,
} from './Components';
import type { Formatter } from './spec';

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
        <fieldset>
          <legend>{resourcesText.conditionField()}</legend>
          <ResourceMapping
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
        </fieldset>
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
  const hasCondition = formatter.definition.conditionField !== undefined;
  const trimmedFields = hasCondition
    ? formatter.definition.fields.slice(0, 1)
    : formatter.definition.fields;

  const table = formatter.table;
  return table === undefined ? null : (
    <div className="flex flex-col gap-4 divide-y divide-gray-500 [&>*]:pt-4">
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
    <table className="grid-table grid-cols-[min-content_auto_auto] gap-2">
      <thead>
        <tr>
          <th>{resourcesText.separator()}</th>
          <th>{schemaText.field()}</th>
          <th>{resourcesText.formatter()}</th>
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
          isReadOnly={isReadOnly}
          value={field.separator}
          onValueChange={(separator): void =>
            handleChange({
              ...field,
              separator,
            })
          }
        />
      </td>
      <td>
        {/* BUG: don't allow direct mapping to "Formatted" */}
        <ResourceMapping
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
        <FieldFormatter field={[field, handleChange]} />
      </td>
    </tr>
  );
}

function FieldFormatter({
  field: [field, handleChange],
}: {
  readonly field: GetSet<
    Formatter['definition']['fields'][number]['fields'][number]
  >;
}): JSX.Element | null {
  const lastField = field.field?.at(-1);
  if (lastField === undefined) return null;
  else if (!lastField.isRelationship)
    return (
      <FieldFormattersPickList
        table={lastField.table}
        value={field.fieldFormatter}
        onChange={(fieldFormatter): void =>
          handleChange({
            ...field,
            fieldFormatter,
          })
        }
      />
    );
  else if (relationshipIsToMany(lastField))
    return (
      <Label.Inline>
        {resourcesText.aggregator()}
        <FormattersPickList
          table={lastField.relatedTable}
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
          table={lastField.relatedTable}
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
