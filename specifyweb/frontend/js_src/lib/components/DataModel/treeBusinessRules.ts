import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { getTreeDefinitionItems } from '../InitialContext/treeRanks';
import { formatUrl } from '../Router/queryString';
import type { BusinessRuleResult } from './businessRules';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import type { Tables } from './types';

// eslint-disable-next-line unicorn/prevent-abbreviations
type TreeDefItem<TREE extends AnyTree> =
  FilterTablesByEndsWith<`${TREE['tableName']}TreeDefItem`>;

export const initializeTreeRecord = (
  resource: SpecifyResource<AnyTree>
): void =>
  resource.isNew()
    ? void resource.set('isAccepted', true, { silent: true })
    : undefined;

export const treeBusinessRules = async (
  resource: SpecifyResource<AnyTree>,
  fieldName: string
): Promise<BusinessRuleResult | undefined> =>
  getRelatedTreeTables(resource).then(async ({ parent, definitionItem }) => {
    if (parent === undefined || definitionItem === undefined) return undefined;

    const lowestRankId = Array.from(
      getTreeDefinitionItems(resource.specifyTable.name, false) ??
        ([] as RA<
          SerializedResource<
            Tables[`${typeof resource.specifyTable.name}TreeDefItem`]
          >
        >)
    )
      .sort(sortFunction(({ rankId }) => rankId, true))
      .at(0)?.rankId;

    if (
      fieldName === 'parent' &&
      (parent.id === resource.id ||
        parent.get('rankId') >= definitionItem.get('rankId'))
    )
      return {
        saveBlockerKey: 'bad-tree-structure',
        fieldOverride:
          parent.get('rankId') === lowestRankId
            ? undefined
            : resource.specifyTable.getField('definitionItem'),
        isValid: false,
        reason: treeText.badStructure(),
      } as BusinessRuleResult;

    if ((resource.get('name')?.length ?? 0) === 0) return undefined;

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
  TREE_DEF_ITEM extends TreeDefItem<AnyTree>
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
  TREE_DEF_ITEM extends TreeDefItem<TREE>
>(
  resource: SpecifyResource<TREE>,
  parent: SpecifyResource<TREE>,
  definitionItem: SpecifyResource<TREE_DEF_ITEM>
): Promise<string> =>
  ajax(
    formatUrl(
      `/api/specify_tree/${resource.specifyTable.name.toLowerCase()}/${
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
