import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { insertItem, removeItem, replaceItem } from '../../utils/utils';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { getFieldsFromPath } from '../DataModel/businessRules';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type {
  UniquenessRule,
  UniquenessRuleValidation,
} from '../DataModel/uniquenessRules';
import { getUniqueInvalidReason } from '../DataModel/uniquenessRules';
import { raise } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { downloadDataSet } from '../WorkBench/helpers';
import { PickList } from './Components';
import { UniquenessRuleScope } from './UniquenessRuleScope';

export function UniquenessRuleRow({
  rule,
  table,
  formId,
  fields,
  relationships,
  isReadOnly,
  fetchedDuplicates,
  onChange: handleChanged,
  onRemoved: handleRemoved,
}: {
  readonly rule: UniquenessRule;
  readonly table: SpecifyTable;
  readonly formId: string;
  readonly fields: RA<LiteralField>;
  readonly relationships: RA<Relationship>;
  readonly isReadOnly: boolean;
  readonly fetchedDuplicates: UniquenessRuleValidation;
  readonly onChange: (newRule: typeof rule) => void;
  readonly onRemoved: () => void;
}): JSX.Element {
  const readOnly = rule.isDatabaseConstraint || isReadOnly;

  const [isModifyingRule, _, __, toggleModifyingRule] = useBooleanState();

  const hasDuplicates = fetchedDuplicates.totalDuplicates !== 0;

  const { validationRef } = useValidation(
    !isModifyingRule && hasDuplicates
      ? schemaText.uniquenessDuplicatesFound()
      : '',
    false
  );

  const invalidUniqueReason = getUniqueInvalidReason(
    rule.scopes.map(
      (scope) => getFieldsFromPath(table, scope).at(-1) as Relationship
    ),
    filterArray(rule.fields.map((field) => table.getField(field)))
  );

  return (
    <tr>
      <td>
        {readOnly ? null : (
          <Button.Small
            aria-selected={isModifyingRule}
            className="w-fit"
            onClick={toggleModifyingRule}
          >
            {icons.pencil}
          </Button.Small>
        )}
        {rule.fields.map((field, index) => (
          <Input.Text
            form={formId}
            forwardRef={index === 0 ? validationRef : undefined}
            isReadOnly
            key={index}
            value={
              (fields.find(({ name }) => name === field) ??
                relationships.find(({ name }) => name === field))!.localization
                .name!
            }
          />
        ))}
      </td>
      <td>
        <Input.Text
          isReadOnly
          value={
            rule.scopes.length === 0
              ? schemaText.database()
              : getFieldsFromPath(table, rule.scopes[0])
                  .map((field) => field.localization.name!)
                  .join(' -> ')
          }
        />
        {isModifyingRule && (
          <ModifyUniquenessRule
            fetchedDuplicates={fetchedDuplicates}
            fields={fields}
            invalidUniqueReason={invalidUniqueReason}
            readOnly={readOnly}
            relationships={relationships}
            rule={rule}
            table={table}
            onChange={handleChanged}
            onClose={toggleModifyingRule}
            onRemoved={handleRemoved}
          />
        )}
      </td>
    </tr>
  );
}

function ModifyUniquenessRule({
  rule,
  table,
  readOnly,
  invalidUniqueReason,
  fields,
  relationships,
  fetchedDuplicates,
  onChange: handleChanged,
  onRemoved: handleRemoved,
  onClose: handleClose,
}: {
  readonly rule: UniquenessRule;
  readonly table: SpecifyTable;
  readonly readOnly: boolean;
  readonly invalidUniqueReason: string;
  readonly fields: RA<LiteralField>;
  readonly relationships: RA<Relationship>;
  readonly fetchedDuplicates: UniquenessRuleValidation;
  readonly onChange: (newRule: typeof rule) => void;
  readonly onRemoved: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );

  const uniqueFields = React.useMemo(
    () =>
      fields.map((field) => [field.name, field.localization.name!] as const),
    [fields]
  );

  const uniqueRelationships = React.useMemo(
    () =>
      relationships.map(
        (field) => [field.name, field.localization.name!] as const
      ),
    [relationships]
  );

  const hasDuplicates = fetchedDuplicates.totalDuplicates !== 0;

  const { validationRef } = useValidation(
    hasDuplicates ? schemaText.uniquenessDuplicatesFound() : undefined,
    false
  );

  return (
    <Dialog
      buttons={
        <>
          <Button.Danger
            disabled={readOnly}
            onClick={(): void => {
              handleRemoved();
              handleClose();
            }}
          >
            {commonText.delete()}
          </Button.Danger>
          <span className="-ml-2 flex-1" />
          {hasDuplicates && (
            <Button.Danger
              onClick={(): void => {
                const fileName = [
                  table.name,
                  ' ',
                  rule.fields.map((field) => field).join(','),
                  '-in_',
                  rule.scopes.length === 0
                    ? schemaText.database()
                    : getFieldsFromPath(table, rule.scopes[0])
                        .map((field) => field.name)
                        .join('_'),
                  '.csv',
                ].join('');

                const columns = [
                  schemaText.numberOfDuplicates(),
                  ...Object.keys(fetchedDuplicates.fields[0].fields).map(
                    (fieldPath) => {
                      const field = getFieldsFromPath(table, fieldPath).at(-1)!;
                      return field.isRelationship
                        ? `${field.name}_id`
                        : field.name;
                    }
                  ),
                ];

                const rows = fetchedDuplicates.fields.map(
                  ({ duplicates, fields }) => [
                    duplicates.toString(),
                    ...Object.values(fields).map((fieldValue) =>
                      JSON.stringify(fieldValue)
                    ),
                  ]
                );

                downloadDataSet(fileName, rows, columns, separator).catch(
                  raise
                );
              }}
            >
              {schemaText.exportDuplicates()}
            </Button.Danger>
          )}
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      dimensionsKey="ModifyUniquenessRule"
      header={schemaText.configureUniquenessRule()}
      icon={icons.pencilAt}
      modal
      onClose={handleClose}
    >
      <>
        <H2>{invalidUniqueReason}</H2>
        <p>{schemaText.uniqueFields()}</p>
        {rule.fields.map((field, index) => (
          <div className="inline-flex gap-2" key={index}>
            <PickList
              disabled={readOnly}
              groups={{
                [schemaText.fields()]: uniqueFields,
                [schemaText.relationships()]: uniqueRelationships,
              }}
              value={field}
              onChange={(value): void => {
                const newField =
                  fields.find(({ name }) => name === value) ??
                  relationships.find(({ name }) => name === value);
                if (newField === undefined) return;
                handleChanged({
                  ...rule,
                  fields: replaceItem(rule.fields, index, newField.name),
                });
              }}
            />
            {rule.fields.length > 1 && (
              <Button.Icon
                className={`w-fit ${className.dataEntryRemove}`}
                disabled={readOnly}
                icon="minus"
                title={commonText.remove()}
                onClick={(): void =>
                  handleChanged({
                    ...rule,
                    fields: removeItem(rule.fields, index),
                  })
                }
              />
            )}
          </div>
        ))}
        <Button.BorderedGray
          className="w-fit"
          disabled={readOnly}
          onClick={(): void =>
            handleChanged({
              ...rule,
              fields: insertItem(
                rule.fields,
                rule.fields.length,
                fields.find(({ name }) => !rule.fields.includes(name))!.name
              ),
            })
          }
        >
          {commonText.add()}
        </Button.BorderedGray>
        <p>{schemaText.scope()}</p>
        <UniquenessRuleScope
          rule={rule}
          table={table}
          onChange={handleChanged}
        />
        <Input.Text
          forwardRef={validationRef}
          isReadOnly={!hasDuplicates}
          value={
            rule.scopes.length === 0
              ? schemaText.database()
              : getFieldsFromPath(table, rule.scopes[0])
                  .map((field) => field.localization.name!)
                  .join(' -> ')
          }
        />
      </>
    </Dialog>
  );
}
