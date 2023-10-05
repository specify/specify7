import { useCachedState } from '../../hooks/useCachedState';
import { formsText } from '../../localization/forms';
import { ajax } from '../../utils/ajax';
import { getCache, setCache } from '../../utils/cache';
import { GetOrSet, RA } from '../../utils/types';
import { formatConjunction } from '../Atoms/Internationalization';
import { load } from '../InitialContext';
import { SerializedResource } from './helperTypes';
import { LiteralField, Relationship } from './specifyField';
import { SpLocaleContainerItem, Tables } from './types';

export type UniquenessRules = {
  [TABLE in keyof Tables]?: RA<{
    id: number | null;
    fields: RA<SerializedResource<SpLocaleContainerItem>>;
    scope: SerializedResource<SpLocaleContainerItem> | null;
    isDatabaseConstraint: boolean;
  }>;
};

const setInitialRules = async () =>
  import('./schemaBase')
    .then(async ({ fetchContext }) => fetchContext)
    .then(async (schema) =>
      load<UniquenessRules>(
        `/businessrules/uniqueness_rules/${schema.domainLevelIds['discipline']}/`,
        'application/json'
      ).then((data) => {
        setCache(
          'businessRules',
          'uniqueRules',
          data as Readonly<Record<string, string>>
        );
        return data;
      })
    );

export const fetchContext = setInitialRules();

export function getUniquenessRules(): undefined | UniquenessRules;
export function getUniquenessRules<TABLE_NAME extends keyof Tables>(
  model: TABLE_NAME
): undefined | UniquenessRules[TABLE_NAME];
export function getUniquenessRules<TABLE_NAME extends keyof Tables>(
  model?: TABLE_NAME
): UniquenessRules | UniquenessRules[TABLE_NAME] {
  const uniquenessRules = getCache('businessRules', 'uniqueRules');
  return uniquenessRules === undefined
    ? undefined
    : model === undefined
    ? uniquenessRules
    : uniquenessRules[model.toLowerCase() as keyof Tables];
}

export function useModelUniquenessRules<TABLE extends keyof Tables>(
  modelName: TABLE
): GetOrSet<UniquenessRules[TABLE]> {
  const [uniquenessRules = {}, setUniquenessRules] = useCachedState(
    'businessRules',
    'uniqueRules'
  );

  const setModelUniquenessRules = (
    value:
      | UniquenessRules[TABLE]
      | ((oldValue: UniquenessRules[TABLE]) => UniquenessRules[TABLE])
  ): void => {
    const adjustedValue =
      typeof value === 'function'
        ? value(uniquenessRules[modelName.toLowerCase() as keyof Tables])
        : value;
    setUniquenessRules(
      Object.fromEntries(
        Object.entries(uniquenessRules).map(([table, rule]) => [
          table,
          table.toLowerCase() === modelName ? adjustedValue : rule,
        ])
      )
    );
  };
  const modelUniqnessRule =
    uniquenessRules[modelName.toLowerCase() as keyof Tables];

  return [modelUniqnessRule, setModelUniquenessRules];
}

export function getUniqueInvalidReason(
  scopeField: LiteralField | Relationship | undefined,
  fields: RA<LiteralField | Relationship>
): string {
  if (fields.length > 1)
    return scopeField
      ? formsText.valuesOfMustBeUniqueToField({
          values: formatConjunction(fields.map((fld) => fld.label)),
          fieldName: scopeField.label,
        })
      : formsText.valuesOfMustBeUniqueToDatabase({
          values: formatConjunction(fields.map((fld) => fld.label)),
        });
  else
    return scopeField
      ? formsText.valueMustBeUniqueToField({
          fieldName: scopeField.label,
        })
      : formsText.valueMustBeUniqueToDatabase();
}

export type UniquenessRuleValidation = {
  totalDuplicates: number;
  fields?: RA<{
    [field: string]: string | number;
    _duplicates: number;
  }>;
};

/**
 *
 */
export async function validateUniqueness<
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME]
>(
  model: TABLE_NAME,
  fields: RA<string & keyof SCHEMA['fields']>,
  scope?: string & keyof SCHEMA['toOneIndependent']
) {
  return ajax<UniquenessRuleValidation>(
    '/businessrules/uniqueness_rules/validate/',
    {
      headers: { Accept: 'application/json' },
      method: 'POST',
      body: {
        model: model,
        rule: {
          fields: fields.map((field) => ({
            name: field,
          })),
          scope: scope === undefined ? null : scope,
        },
      },
    }
  );
}
