import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetOrSet, GetSet, RA, WritableArray } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { hasTablePermission } from '../Permissions/helpers';
import { ResourceMapping } from './Components';
import { Fields } from './Fields';
import { fetchPathAsString, format } from './formatters';
import { ResourcePreview } from './Preview';
import type { Formatter } from './spec';

export function FormatterElement({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  return (
    <>
      {typeof formatter.table === 'object' && (
        <ConditionalMapping item={[formatter, setFormatter]} />
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

function ConditionalMapping({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);

  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );

  const [isConditionFieldDisplayed, setIsConditionFieldDisplayed] =
    useTriggerState(formatter.definition.conditionField !== undefined);

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
      {isConditionFieldDisplayed && typeof formatter.table === 'object' ? (
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
      ) : null}
    </fieldset>
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

  const needFormatter = formatter.definition.fields.length === 0;
  React.useEffect(() => {
    if (needFormatter) {
      handleChange([
        ...formatter.definition.fields,
        {
          value: undefined,
          fields: [],
        },
      ]);
    }
  }, [needFormatter, handleChange, formatter.definition.fields]);

  const [showConditionalField, setShowConditionalField] = React.useState<
    WritableArray<boolean>
  >(trimmedFields.map(() => false));

  return table === undefined ? null : (
    <div className="flex flex-col gap-4 divide-y divide-gray-500 [&>*]:pt-4">
      {trimmedFields.map(({ value, fields }, index) => (
        <ConditionalFormatter
          fields={fields}
          formatter={formatter}
          hasCondition={hasCondition}
          index={index}
          isCollapsed={showConditionalField[index]}
          key={index}
          showConditionalField={[showConditionalField, setShowConditionalField]}
          table={table}
          trimmedFieldsLength={trimmedFields.length}
          value={value}
          onChange={handleChange}
          onChanged={handleChanged}
          onRemoveField={(removedIndex: number): void => {
            const updatedShowConditionalField =
              Array.from(showConditionalField);
            updatedShowConditionalField.splice(removedIndex, 1);
            setShowConditionalField(updatedShowConditionalField);
          }}
        />
      ))}
      {!isReadOnly && hasCondition ? (
        <div>
          <Button.Info
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
          </Button.Info>
        </div>
      ) : null}
    </div>
  );
}

function ConditionalFormatter({
  isCollapsed,
  value,
  fields,
  hasCondition,
  index,
  onChanged: handleChanged,
  showConditionalField: [showConditionalField, setShowConditionalField],
  trimmedFieldsLength,
  formatter,
  onChange: handleChange,
  table,
  onRemoveField: handleRemoveField,
}: {
  readonly isCollapsed: boolean;
  readonly value: LocalizedString | undefined;
  readonly fields: Formatter['definition']['fields'][number]['fields'];
  readonly hasCondition: boolean;
  readonly index: number;
  readonly onChanged: (
    field: Formatter['definition']['fields'][number],
    index: number
  ) => void;
  readonly showConditionalField: GetOrSet<WritableArray<boolean>>;
  readonly trimmedFieldsLength: number;
  readonly formatter: GetSet<Formatter>[0];
  readonly onChange: (fields: Formatter['definition']['fields']) => void;
  readonly table: SpecifyTable;
  readonly onRemoveField: (index: number) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);

  return (
    <div
      className={`flex ${
        isCollapsed || !hasCondition ? 'flex-col' : 'items-center'
      } gap-2`}
      key={index}
    >
      {hasCondition && (
        <Label.Block>
          {isCollapsed ? resourcesText.conditionFieldValue() : null}
          <div className="flex items-center gap-2">
            <Input.Text
              className="h-full"
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
            {trimmedFieldsLength > 0 && isCollapsed ? (
              <Button.Danger
                className="w-[40%]"
                onClick={(): void => {
                  handleRemoveField(index);
                  handleChange(removeItem(formatter.definition.fields, index));
                }}
              >
                {resourcesText.deleteDefinition()}
              </Button.Danger>
            ) : null}
          </div>
          {isCollapsed ? (
            <span>
              {index === 0
                ? resourcesText.elseConditionDescription()
                : resourcesText.conditionDescription()}
            </span>
          ) : null}
        </Label.Block>
      )}
      {isCollapsed || !hasCondition ? null : fields.length === 0 ? (
        <Button.Small
          onClick={(): void => {
            const newConditionalField = Array.from(showConditionalField);
            newConditionalField[index] = !newConditionalField[index];
            setShowConditionalField(newConditionalField);
            handleChanged(
              {
                value,
                fields: [
                  {
                    separator: localized(' '),
                    aggregator: undefined,
                    formatter: undefined,
                    fieldFormatter: undefined,
                    field: undefined,
                  },
                ],
              },
              index
            );
          }}
        >
          {resourcesText.addField()}
        </Button.Small>
      ) : (
        fields.map((field, index) => (
          <p key={index}>
            {field.separator === undefined ? '' : field.separator}
            {field.field === undefined ? '' : field.field[0].label}
          </p>
        ))
      )}
      {isCollapsed || !hasCondition ? (
        <Fields
          fields={[
            fields,
            (fields): void => handleChanged({ value, fields }, index),
          ]}
          table={table}
        />
      ) : null}
      <span className="-ml-2 flex-1" />
      <div className="inline-flex">
        {trimmedFieldsLength === 1 || isCollapsed ? null : (
          <Button.Icon
            icon="trash"
            title={resourcesText.deleteDefinition()}
            onClick={(): void => {
              handleRemoveField(index);
              handleChange(removeItem(formatter.definition.fields, index));
            }}
          />
        )}
      </div>
      <div className="flex">
        {isCollapsed ? <span className="-ml-2 flex-1" /> : null}
        {hasCondition ? (
          <Button.Icon
            icon={isCollapsed ? 'chevronUp' : 'chevronDown'}
            title="showConditionalField"
            onClick={(): void => {
              const newConditionalField = Array.from(showConditionalField);
              newConditionalField[index] = !newConditionalField[index];
              setShowConditionalField(newConditionalField);
            }}
          />
        ) : null}
      </div>
    </div>
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
