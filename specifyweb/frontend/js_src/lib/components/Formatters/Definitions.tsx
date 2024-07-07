import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
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

  const resolvedFields =
    trimmedFields.length === 0
      ? [{ value: undefined, fields: [] }]
      : trimmedFields;

  return table === undefined ? null : (
    <div className="flex flex-col content-center divide-y divide-gray-500">
      {resolvedFields.map(({ value, fields }, index) => (
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
        <div className="pt-4">
          <Button.Info
            title={resourcesText.addDefinition()}
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

  const handleDelete = (): void =>
    handleChange(removeItem(formatter.definition.fields, index));

  const expandedNoCondition = isExpanded || !hasCondition;

  return (
    <div
      className={`flex
        ${isExpanded || !hasCondition ? 'flex-col' : ''}
        ${isExpanded ? 'gap-2' : ''}
        ${
          fields.length === 0 &&
          hasCondition &&
          trimmedFieldsLength > 0 &&
          !isExpanded &&
          index !== 0
            ? 'items-center'
            : ''
        }
      `}
      key={index}
    >
      {hasCondition && (
        <div className={`${isExpanded ? '' : 'gap-2 p-2'} flex flex-col`}>
          {!isExpanded && index === 0 ? (
            <span className="font-bold">
              {resourcesText.conditionalFieldValue()}
            </span>
          ) : null}
          <Label.Block>
            {isExpanded ? resourcesText.conditionFieldValue() : null}
            <div className="flex items-center gap-2 pr-2">
              <div className="h-full flex-1">
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
              {trimmedFieldsLength > 0 && isExpanded && !isReadOnly ? (
                <Button.Danger onClick={handleDelete}>
                  {resourcesText.deleteDefinition()}
                </Button.Danger>
              ) : null}
              {hasCondition && isExpanded ? (
                <Button.Icon
                  icon="chevronUp"
                  title={resourcesText.collapseConditionalField()}
                  onClick={handleToggle}
                />
              ) : null}
            </div>
            {isExpanded ? (
              <span>{resourcesText.conditionDescription()}</span>
            ) : null}
          </Label.Block>
        </div>
      )}
      {expandedNoCondition || isReadOnly ? undefined : fields.length === 0 ? (
        <div className="flex flex-col p-2">
          <span className="flex-1" />
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
        </div>
      ) : (
        <div className="flex flex-col flex-wrap whitespace-pre-wrap p-2">
          {index === 0 && (
            <span className="font-bold">{resourcesText.formatPreview()}</span>
          )}
          {fields
            .map(
              (field) =>
                `${field.separator === undefined ? '' : field.separator}${
                  field.field === undefined ? '' : field.field[0].label
                }`
            )
            .join('')}
        </div>
      )}
      {expandedNoCondition ? (
        <Fields
          fields={[
            fields,
            (fields): void => handleChanged({ value, fields }, index),
          ]}
          table={table}
        />
      ) : null}
      <span className="-ml-2 flex-1" />
      <div className="flex flex-col">
        {!isExpanded && hasCondition && index === 0 ? (
          <span className="font-bold">{commonText.expand()}</span>
        ) : null}
        <div className="flex">
          {trimmedFieldsLength === 1 ||
          isExpanded ||
          isReadOnly ||
          fields.length === 0 ? null : (
            <div className="inline-flex">
              <Button.Icon
                icon="trash"
                title={resourcesText.deleteDefinition()}
                onClick={handleDelete}
              />
            </div>
          )}
          <div className="flex p-2">
            {hasCondition && !isExpanded ? (
              <Button.Icon
                icon="chevronDown"
                title={resourcesText.expandConditionalField()}
                onClick={handleToggle}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
