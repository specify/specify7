import React from 'react';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import type { GetSet } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import {
  FieldFormattersPickList,
  FormattersPickList,
  ResourceMapping,
} from './Components';
import { format } from './formatters';
import { GenericFormatterPreview } from './Preview';
import type { Formatter } from './spec';

export function FormatterElement({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
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
      {typeof formatter.table === 'object' &&
      hasTablePermission(formatter.table.name, 'read') ? (
        <FormatterPreview formatter={formatter} />
      ) : undefined}
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
    ? formatter.definition.fields
    : formatter.definition.fields.slice(0, 1);

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
              onDelete={
                trimmedFields.length < 2
                  ? undefined
                  : () =>
                      handleChange(
                        removeItem(formatter.definition.fields, index)
                      )
              }
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
  onDelete: handleDelete,
}: {
  readonly table: SpecifyTable;
  readonly fields: GetSet<Formatter['definition']['fields'][number]['fields']>;
  readonly onDelete: (() => void) | undefined;
}): JSX.Element {
  return (
    <table className="grid-table grid-cols-[min-content_auto_auto_min-content] gap-2">
      <thead>
        <tr>
          <th>{resourcesText.separator()}</th>
          <th>{schemaText.field()}</th>
          <th>{resourcesText.formatter()}</th>
          <td />
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
            onRemove={(): void => setFields(removeItem(fields, index))}
          />
        ))}
        <tr>
          <td className="col-span-3">
            <Button.Green
              onClick={(): void =>
                setFields([
                  ...fields,
                  {
                    separator: '',
                    aggregator: undefined,
                    formatter: undefined,
                    fieldFormatter: undefined,
                    field: undefined,
                  },
                ])
              }
            >
              {resourcesText.addField()}
            </Button.Green>
            {typeof handleDelete === 'function' && (
              <Button.Red onClick={handleDelete}>
                {resourcesText.deleteDefinition()}
              </Button.Red>
            )}
          </td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

function Field({
  table,
  field: [field, handleChange],
  onRemove: handleRemove,
}: {
  readonly table: SpecifyTable;
  readonly field: GetSet<
    Formatter['definition']['fields'][number]['fields'][number]
  >;
  readonly onRemove: () => void;
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
      <td>
        <Button.Small
          aria-label={commonText.remove()}
          title={commonText.remove()}
          variant={className.redButton}
          onClick={handleRemove}
        >
          {icons.trash}
        </Button.Small>
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

function FormatterPreview({
  formatter,
}: {
  readonly formatter: Formatter;
}): JSX.Element {
  return (
    <GenericFormatterPreview
      doFormatting={React.useCallback(
        async (resources) =>
          Promise.all(
            resources.map(async (resource) =>
              format(resource, formatter, false).then(
                (formatted) => formatted ?? ''
              )
            )
          ),
        [formatter]
      )}
      table={formatter.table}
    />
  );
}
