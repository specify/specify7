import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { resourcesText } from '../../localization/resources';
import type { GetSet } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { Fields } from './Fields';
import type { Formatter } from './spec';

export function Definitions({
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

  return table === undefined ? null : (
    <div className="flex flex-col gap-4 divide-y divide-gray-500 [&>*]:pt-4">
      {trimmedFields.map(({ value, fields }, index) => (
        <ConditionalFormatter
          fields={fields}
          formatter={formatter}
          hasCondition={hasCondition}
          index={index}
          key={index}
          table={table}
          trimmedFieldsLength={trimmedFields.length}
          value={value}
          onChange={handleChange}
          onChanged={handleChanged}
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
  value,
  fields,
  hasCondition,
  index,
  onChanged: handleChanged,
  trimmedFieldsLength,
  formatter,
  onChange: handleChange,
  table,
}: {
  readonly value: LocalizedString | undefined;
  readonly fields: Formatter['definition']['fields'][number]['fields'];
  readonly hasCondition: boolean;
  readonly index: number;
  readonly onChanged: (
    field: Formatter['definition']['fields'][number],
    index: number
  ) => void;
  readonly trimmedFieldsLength: number;
  readonly formatter: GetSet<Formatter>[0];
  readonly onChange: (fields: Formatter['definition']['fields']) => void;
  readonly table: SpecifyTable;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [isExpanded, _, __, handleToggle] = useBooleanState(false);
  return (
    <div
      className={`flex ${
        isExpanded || !hasCondition ? 'flex-col' : 'items-center'
      } gap-2`}
      key={index}
    >
      {hasCondition && (
        <Label.Block>
          {isExpanded ? resourcesText.conditionFieldValue() : null}
          <div className="flex items-center gap-2">
            <div className="flex-1">
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
            </div>
            <span className="-ml-2" />
            {trimmedFieldsLength > 0 && isExpanded ? (
              <Button.Danger
                onClick={(): void => {
                  handleChange(removeItem(formatter.definition.fields, index));
                }}
              >
                {resourcesText.deleteDefinition()}
              </Button.Danger>
            ) : null}
            {hasCondition && isExpanded ? (
              <Button.Icon
                icon={isExpanded ? 'chevronUp' : 'chevronDown'}
                title="showConditionalField"
                onClick={handleToggle}
              />
            ) : null}
          </div>
          {isExpanded ? (
            <span>
              {index === 0
                ? resourcesText.elseConditionDescription()
                : resourcesText.conditionDescription()}
            </span>
          ) : null}
        </Label.Block>
      )}
      {isExpanded || !hasCondition ? null : fields.length === 0 ? (
        <Button.Small
          onClick={(): void => {
            handleToggle();
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
      {isExpanded || !hasCondition ? (
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
        {trimmedFieldsLength === 1 || isExpanded ? null : (
          <Button.Icon
            icon="trash"
            title={resourcesText.deleteDefinition()}
            onClick={(): void => {
              handleChange(removeItem(formatter.definition.fields, index));
            }}
          />
        )}
      </div>
      <div className="flex">
        {isExpanded ? <span className="-ml-2 flex-1" /> : null}
        {hasCondition && !isExpanded ? (
          <Button.Icon
            icon={isExpanded ? 'chevronUp' : 'chevronDown'}
            title="showConditionalField"
            onClick={handleToggle}
          />
        ) : null}
      </div>
    </div>
  );
}
