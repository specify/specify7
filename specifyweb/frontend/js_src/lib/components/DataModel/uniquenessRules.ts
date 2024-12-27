import React from 'react';

import { formsText } from '../../localization/forms';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import {
  type GetOrSet,
  type IR,
  type RA,
  type RR,
  filterArray,
  setDevelopmentGlobal,
} from '../../utils/types';
import { formatConjunction } from '../Atoms/Internationalization';
import { load } from '../InitialContext';
import type { LiteralField, Relationship } from './specifyField';
import { getTable } from './tables';
import type { Tables } from './types';

export type UniquenessRule = {
  readonly id: number | null;
  readonly fields: RA<string>;
  readonly scopes: RA<string>;
  readonly modelName: keyof Tables;
  readonly isDatabaseConstraint: boolean;
};

export type UniquenessRules = Partial<
  RR<
    keyof Tables,
    | RA<{
        readonly rule: UniquenessRule;
        readonly duplicates: UniquenessRuleValidation;
      }>
    | undefined
  >
>;

export type UniquenessRuleValidation = {
  readonly totalDuplicates: number;
  readonly fields: RA<{
    readonly fields: IR<string>;
    readonly duplicates: number;
  }>;
};

let uniquenessRules: UniquenessRules = {};

export const fetchContext = f
  .all({
    schema: import('./schema').then(async ({ fetchContext }) => fetchContext),
    tables: import('../DataModel/tables').then(
      async ({ fetchContext }) => fetchContext
    ),
  })
  .then(async ({ schema }) =>
    load<UniquenessRules>(
      `/businessrules/uniqueness_rules/${schema.domainLevelIds.discipline}/`,
      'application/json'
    )
  )
  .then((data) =>
    Object.fromEntries(
      filterArray(
        Object.entries(data).map(([lowercaseTableName, rules]) => {
          // Convert all lowercase table names from backend to PascalCase
          const table = getTable(lowercaseTableName);
          if (table === undefined) return undefined;
          return [
            table.name,
            rules
              ?.filter(({ rule }) =>
                rule.fields.some((field) => table.getField(field) !== undefined)
              )
              .map(({ rule }) => ({
                rule,
                duplicates: { totalDuplicates: 0, fields: [] },
              })),
          ];
        })
      )
    )
  )
  .then((data) => {
    uniquenessRules = data;
    setDevelopmentGlobal('_uniquenessRules', data);
    return data;
  });

export function getUniquenessRules(): UniquenessRules | undefined;
export function getUniquenessRules<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME
): UniquenessRules[TABLE_NAME] | undefined;
export function getUniquenessRules<TABLE_NAME extends keyof Tables>(
  tableName?: TABLE_NAME
): UniquenessRules | UniquenessRules[TABLE_NAME] {
  return Object.keys(uniquenessRules).length === 0
    ? undefined
    : tableName === undefined
      ? uniquenessRules
      : uniquenessRules[tableName];
}

export function useTableUniquenessRules(
  tableName: keyof Tables
): readonly [
  ...tableRules: GetOrSet<UniquenessRules[keyof Tables]>,
  setCachedTableRules: (value: UniquenessRules[keyof Tables]) => void,
] {
  const [rawModelRules = [], setTableUniquenessRules] = React.useState(
    uniquenessRules[tableName]
  );

  const setStoredUniquenessRules = (
    value: UniquenessRules[keyof Tables]
  ): void => {
    uniquenessRules = {
      ...uniquenessRules,
      [tableName]: value,
    };
  };

  return [rawModelRules, setTableUniquenessRules, setStoredUniquenessRules];
}

export function getUniqueInvalidReason(
  scopeFields: RA<Relationship>,
  fields: RA<LiteralField | Relationship>
): string {
  if (fields.length > 1)
    return scopeFields.length > 0
      ? formsText.valuesOfMustBeUniqueToField({
          values: formatConjunction(fields.map(({ label }) => label)),
          fieldName: formatConjunction(scopeFields.map(({ label }) => label)),
        })
      : formsText.valuesOfMustBeUniqueToDatabase({
          values: formatConjunction(fields.map(({ label }) => label)),
        });
  else
    return scopeFields.length > 0
      ? formsText.valueMustBeUniqueToField({
          fieldName: formatConjunction(scopeFields.map(({ label }) => label)),
        })
      : formsText.valueMustBeUniqueToDatabase();
}

export async function validateUniqueness<
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME],
>(
  table: TABLE_NAME,
  fields: RA<string & keyof SCHEMA['fields']>,
  scopes: RA<keyof SCHEMA['toOneDependent'] | keyof SCHEMA['toOneIndependent']>
): Promise<UniquenessRuleValidation> {
  return ajax<UniquenessRuleValidation>(
    '/businessrules/uniqueness_rules/validate/',
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
      method: 'POST',
      body: {
        table,
        rule: {
          fields,
          scopes,
        },
      },
    }
  ).then(({ data }) => data);
}
