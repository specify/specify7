import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { fetchPossibleRanks } from '../PickLists/TreeLevelPickList';
import { formatUrl } from '../Router/queryString';
import type { BusinessRuleResult } from './businessRules';
import type { AnyTree, TableFields } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { idFromUrl } from './resource';
import type { Tables } from './types';

// eslint-disable-next-line unicorn/prevent-abbreviations
export type TreeDefItem<TREE extends AnyTree> =
  Tables[`${TREE['tableName']}TreeDefItem`];

export const initializeTreeRecord = (
  resource: SpecifyResource<AnyTree>
): void =>
  resource.isNew()
    ? void resource.set('isAccepted', true, { silent: true })
    : undefined;

export const treeBusinessRules = async (
  resource: SpecifyResource<AnyTree>,
  fieldName: TableFields<AnyTree>
): Promise<BusinessRuleResult | undefined> =>
  getRelatedTreeTables(resource).then(async ({ parent, definitionItem }) => {
    if (parent === undefined) return undefined;

    const parentDefItem = ((await parent.rgetPromise('definitionItem')) ??
      undefined) as SpecifyResource<TreeDefItem<AnyTree>> | undefined;

    const possibleRanks =
      parentDefItem === undefined
        ? undefined
        : await fetchPossibleRanks(
            resource,
            parentDefItem.get('rankId'),
            idFromUrl(parentDefItem.get('treeDef'))!
          );

    const { collectionPreferences } = await import('../Preferences/collectionPreferences');
    const strictChecksEnabled = getStrictSynonymizationChecksPref(
      collectionPreferences,
      resource.specifyTable.name
    );

    const isParentSynonym = !parent.get('isAccepted');

    const hasBadTreeStrcuture =
      parent.id === resource.id ||
      definitionItem === undefined ||
      (isParentSynonym && strictChecksEnabled) ||
      parent.get('rankId') >= definitionItem.get('rankId') ||
      (possibleRanks !== undefined &&
        !possibleRanks
          .map(({ resource_uri }) => resource_uri)
          .includes(definitionItem.get('resource_uri')));

    if (!hasBadTreeStrcuture && (resource.get('name').length ?? 0) === 0)
      return {
        saveBlockerKey: 'bad-tree-structure',
        isValid: true,
      };

    if (fieldName === 'parent' && hasBadTreeStrcuture)
      return {
        saveBlockerKey: 'bad-tree-structure',
        isValid: false,
        reason: treeText.badStructure(),
      };

    if (
      hasBadTreeStrcuture ||
      (resource.get('name')?.length ?? 0) === 0 ||
      definitionItem === undefined
    )
      return undefined;

    return predictFullName(resource, parent, definitionItem).then(
      (fullName) => ({
        saveBlockerKey: 'bad-tree-structure',
        isValid: true,
        action: () =>
          resource.set(
            'fullName',
            typeof fullName === 'string' ? fullName : null,
            { silent: true }
          ),
      })
    );
  });

const getRelatedTreeTables = async <
  TREE extends AnyTree,
  TREE_DEF_ITEM extends TreeDefItem<AnyTree>,
>(
  resource: SpecifyResource<TREE>
): Promise<{
  readonly parent: SpecifyResource<TREE> | undefined;
  readonly definitionItem: SpecifyResource<TREE_DEF_ITEM> | undefined;
}> =>
  f.all({
    parent: (
      resource.getRelated('parent', {
        prePop: true,
        noBusinessRules: true,
      }) as Promise<SpecifyResource<TREE> | undefined>
    ).then((resource) => resource ?? undefined),
    definitionItem: (
      resource.rgetPromise('definitionItem') as Promise<
        SpecifyResource<TREE_DEF_ITEM> | undefined
      >
    ).then((resource) => resource ?? undefined),
  });

const predictFullName = async <
  TREE extends AnyTree,
  TREE_DEF_ITEM extends TreeDefItem<TREE>,
>(
  resource: SpecifyResource<TREE>,
  parent: SpecifyResource<TREE>,
  definitionItem: SpecifyResource<TREE_DEF_ITEM>
): Promise<string> =>
  ajax(
    formatUrl(
      `/trees/specify_tree/${resource.specifyTable.name.toLowerCase()}/${
        parent.id
      }/predict_fullname/`,
      {
        name: resource.get('name'),
        treeDefItemId: definitionItem.id,
      }
    ),
    {
      headers: { Accept: 'text/plain' },
    }
  ).then(({ data }) => data);

const strictTrees = [
  'Taxon',
  'Geography',
  'Storage',
  'GeologicTimePeriod',
  'LithoStrat',
  'TectonicUnit',
] as const;

type StrictTreeName = (typeof strictTrees)[number];

const isStrictTreeName = (value: string): value is StrictTreeName =>
  (strictTrees as readonly string[]).includes(value);

const legacyExpandKeyByTree: Record<
  StrictTreeName,
  | 'sp7.allow_adding_child_to_synonymized_parent.Taxon'
  | 'sp7.allow_adding_child_to_synonymized_parent.Geography'
  | 'sp7.allow_adding_child_to_synonymized_parent.Storage'
  | 'sp7.allow_adding_child_to_synonymized_parent.GeologicTimePeriod'
  | 'sp7.allow_adding_child_to_synonymized_parent.LithoStrat'
  | 'sp7.allow_adding_child_to_synonymized_parent.TectonicUnit'
> = {
  Taxon: 'sp7.allow_adding_child_to_synonymized_parent.Taxon',
  Geography: 'sp7.allow_adding_child_to_synonymized_parent.Geography',
  Storage: 'sp7.allow_adding_child_to_synonymized_parent.Storage',
  GeologicTimePeriod:
    'sp7.allow_adding_child_to_synonymized_parent.GeologicTimePeriod',
  LithoStrat: 'sp7.allow_adding_child_to_synonymized_parent.LithoStrat',
  TectonicUnit: 'sp7.allow_adding_child_to_synonymized_parent.TectonicUnit',
} as const;

export function getStrictSynonymizationChecksPref(
  collectionPreferences: { get: (...args: any[]) => unknown },
  tableName: string
): boolean {
  if (!isStrictTreeName(tableName)) return false;

  const strict = collectionPreferences.get(
    'treeManagement',
    'strict_synonymization_checks',
    tableName
  );
  if (typeof strict === 'boolean') return strict;

  const expand = collectionPreferences.get(
    'treeManagement',
    'expand_synonymization_actions',
    tableName
  );
  if (typeof expand === 'boolean') return !expand;

  const legacyAllowExpand = collectionPreferences.get(
    'treeManagement',
    'synonymized',
    legacyExpandKeyByTree[tableName]
  );
  if (typeof legacyAllowExpand === 'boolean') return !legacyAllowExpand;

  return true;
}
