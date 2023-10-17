import React from 'react';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { fetchContext as fetchFieldFormatters } from '../FieldFormatters';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import {
  FormattersPickList,
  GenericFormatterPickList,
  ResourceMapping,
} from './Components';
import { fetchPathAsString, format } from './formatters';
import { ResourcePreview } from './Preview';
import type { Formatter } from './spec';

export function FormatterElement({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );
  const [isConditionFieldDisplayed, setIsConditionFieldDisplayed] =
    React.useState(false);
  const isReadOnly = React.useContext(ReadOnlyContext);
  function setConditionField(): void {
    setIsConditionFieldDisplayed(!isConditionFieldDisplayed);
    if (isConditionFieldDisplayed)
      setFormatter({
        ...formatter,
        definition: {
          ...formatter.definition,
          conditionField: undefined,
        },
      });
  }

  return (
    <>
      {typeof formatter.table === 'object' && (
        <fieldset>
          <Label.Inline>
            <Input.Checkbox
              checked={
                isConditionFieldDisplayed ||
                formatter.definition.conditionField !== undefined
              }
              isReadOnly={isReadOnly}
              onClick={setConditionField}
            />
            {resourcesText.conditionalFormatter()}
          </Label.Inline>
          {isConditionFieldDisplayed && (
            <ResourceMapping
              mapping={[
                formatter.definition.conditionField,
                (conditionField): void => {
                  setFormatter({
                    ...formatter,
                    definition: {
                      ...formatter.definition,
                      conditionField,
                    },
                  });
                },
              ]}
              openIndex={[openIndex, setOpenIndex]}
              table={formatter.table}
            />
          )}
        </fieldset>
      )}
      {formatter.definition.external === undefined ? (
        <Definitions item={[formatter, setFormatter]} />
      ) : (
        <ErrorMessage>{resourcesText.editorNotAvailable()}</ErrorMessage>
      )}
      <FormatterPreview formatter={formatter} />
    </>
  );
}

function Definitions({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element | null {
  const isReadOnly = React.useContext(ReadOnlyContext);

  const handleChange = React.useCallback(
    (fields: Formatter['definition']['fields']): void => {
      setFormatter({
        ...formatter,
        definition: {
          ...formatter.definition,
          fields,
        },
      });
    },
    [formatter, setFormatter]
  );

  const hasCondition = formatter.definition.conditionField !== undefined;
  const trimmedFields = hasCondition
    ? formatter.definition.fields
    : formatter.definition.fields.slice(0, 1);

  const table = formatter.table;

  const handleChanged = (
    field: Formatter['definition']['fields'][number],
    index: number
  ): void =>
    handleChange(replaceItem(formatter.definition.fields, index, field));

  React.useEffect(() => {
    if (formatter.definition.fields.length === 0) {
      handleChange([
        ...formatter.definition.fields,
        {
          value: undefined,
          fields: [],
        },
      ]);
    }
  }, [formatter.definition.fields, handleChange]);

  return table === undefined ? null : (
    <div className="flex flex-col gap-4 divide-y divide-gray-500 [&>*]:pt-4">
      {trimmedFields.map(({ value, fields }, index) => (
        <div className="flex flex-col gap-2" key={index}>
          {hasCondition && (
            <>
              <Label.Block>
                {resourcesText.conditionFieldValue()}
                <Input.Text
                  isReadOnly={isReadOnly}
                  value={value ?? ''}
                  onValueChange={(value): void =>
                    handleChanged(
                      {
                        value: value.length === 0 ? undefined : value,
                        fields,
                      },
                      index
                    )
                  }
                />
                <span>
                  {index === 0
                    ? resourcesText.elseConditionDescription()
                    : resourcesText.conditionDescription()}
                </span>
              </Label.Block>
              <Fields
                fields={[
                  fields,
                  (fields): void => handleChanged({ value, fields }, index),
                ]}
                table={table}
                onDelete={
                  trimmedFields.length < 2
                    ? undefined
                    : (): void =>
                        handleChange(
                          removeItem(formatter.definition.fields, index)
                        )
                }
              />
            </>
          )}
          {!hasCondition && (
            <Fields
              fields={[
                fields,
                (fields): void => handleChanged({ value, fields }, index),
              ]}
              table={table}
              onDelete={
                trimmedFields.length < 2
                  ? undefined
                  : (): void =>
                      handleChange(
                        removeItem(formatter.definition.fields, index)
                      )
              }
            />
          )}
        </div>
      ))}
      {!isReadOnly && hasCondition ? (
        <div>
          <Button.Success
            title={
              hasCondition ? undefined : resourcesText.addConditionFieldFirst()
            }
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
          </Button.Success>
        </div>
      ) : null}
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
  const [displayFormatter, setDisplayFormatter] = React.useState(false);
  return (
    <>
      {fields.length === 0 ? null : (
        <table
          /*
           * REFACTOR: replace min-w-[35rem] with a container query that replaces
           *   table layout with list layout
           */
          className={`
        grid-table min-w-[35rem]
        gap-y-2 gap-x-4
        ${
          displayFormatter
            ? 'grid-cols-[min-content_max-content_auto_min-content]'
            : 'grid-cols-[auto_1fr_auto]'
        }
      `}
        >
          <thead>
            <tr>
              <th>{resourcesText.separator()}</th>
              <th>{schemaText.field()}</th>
              {displayFormatter && <th>{schemaText.fieldFormat()}</th>}
              <th />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <Field
                displayFormatter={displayFormatter}
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
              <td className="col-span-3 !gap-2">
                {typeof handleDelete === 'function' && (
                  <Button.Danger onClick={handleDelete}>
                    {resourcesText.deleteDefinition()}
                  </Button.Danger>
                )}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      )}
      <div className="flex gap-2">
        <Button.Success
          onClick={(): void =>
            setFields([
              ...fields,
              {
                separator: localized(' '),
                aggregator: undefined,
                formatter: undefined,
                fieldFormatter: undefined,
                field: undefined,
              },
            ])
          }
        >
          {resourcesText.addField()}
        </Button.Success>
        <span className="-ml-2 flex-1" />
        {fields.length > 0 && (
          <Label.Inline>
            <Input.Checkbox
              checked={displayFormatter}
              onClick={(): void => setDisplayFormatter(!displayFormatter)}
            />
            {resourcesText.formatter()}
          </Label.Inline>
        )}
      </div>
    </>
  );
}

function Field({
  table,
  field: [field, handleChange],
  onRemove: handleRemove,
  displayFormatter,
}: {
  readonly table: SpecifyTable;
  readonly field: GetSet<
    Formatter['definition']['fields'][number]['fields'][number]
  >;
  readonly onRemove: () => void;
  readonly displayFormatter: boolean;
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
        <ResourceMapping
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
      {displayFormatter && (
        <td>
          <FieldFormatter field={[field, handleChange]} />
        </td>
      )}
      <td>
        <Button.Small
          aria-label={commonText.remove()}
          title={commonText.remove()}
          variant={className.dangerButton}
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
      <Label.Inline className="w-full">
        <GenericFormatterPickList
          itemsPromise={fetchFieldFormatters}
          table={lastField.table}
          value={field.fieldFormatter}
          onChange={(fieldFormatter): void =>
            handleChange({
              ...field,
              fieldFormatter,
            })
          }
        />
      </Label.Inline>
    );
  else if (relationshipIsToMany(lastField))
    return (
      <Label.Inline className="w-full">
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
      <Label.Inline className="w-full">
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
}): JSX.Element | null {
  const doFormatting = React.useCallback(
    async (resources: RA<SpecifyResource<AnySchema>>) =>
      Promise.all(
        resources.map(async (resource) =>
          f
            .all({
              formatted: format(resource, formatter, false),
              condition:
                formatter.definition.conditionField === undefined
                  ? undefined
                  : fetchPathAsString(
                      resource,
                      formatter.definition.conditionField,
                      false
                    ),
            })
            .then(({ formatted, condition }) =>
              `${formatted ?? ''}\n${
                condition === undefined
                  ? ''
                  : commonText.colonLine({
                      label: resourcesText.conditionFieldValue(),
                      value: condition,
                    })
              }`.trim()
            )
        )
      ),
    [formatter]
  );
  return typeof formatter.table === 'object' &&
    hasTablePermission(formatter.table.name, 'read') ? (
    <ResourcePreview doFormatting={doFormatting} table={formatter.table} />
  ) : null;
}
