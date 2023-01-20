import { ajax } from '../../utils/ajax';
import type { Taxon, TaxonTreeDefItem } from './types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from './legacyTypes';
import { treeText } from '../../localization/tree';
import { formatUrl } from '../Router/queryString';
import { AnyTree } from './helperTypes';

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
  fieldName === 'parent'
    ? predictFullName(resource, true)
    : fieldName === 'name' || fieldName.toLowerCase() === 'definitionitem'
    ? predictFullName(resource, false)
    : undefined;

export type BusinessRuleResult = {
  readonly key: string;
} & (
  | {
      readonly valid: true;
      readonly action: () => void;
    }
  | { readonly valid: false; readonly reason: string }
);

const predictFullName = async (
  resource: SpecifyResource<AnyTree>,
  reportBadStructure: boolean
): Promise<BusinessRuleResult | undefined> =>
  f
    .all({
      parent: resource
        .getRelated('parent', {
          prePop: true,
          noBusinessRules: true,
        })
        .then((resource) => (resource as SpecifyResource<Taxon>) ?? undefined),
      definitionItem: resource
        .rgetPromise('definitionItem')
        .then(
          (resource) =>
            (resource as SpecifyResource<TaxonTreeDefItem>) ?? undefined
        ),
    })
    .then(({ parent, definitionItem }) => {
      if (parent === undefined || definitionItem === undefined)
        return undefined;
      if (
        parent.id === resource.id ||
        parent.get('rankId') >= definitionItem.get('rankId')
      )
        throw new Error('bad-tree-structure');
      if ((resource.get('name')?.length ?? 0) === 0) return undefined;

      const treeName = resource.specifyModel.name.toLowerCase();
      return ajax(
        formatUrl(
          `/api/specify_tree/${treeName}/${parent.id}/predict_fullname/`,
          {
            name: resource.get('name'),
            treeDefItemId: definitionItem.id?.toString(),
          }
        ),
        {
          headers: { Accept: 'text/plain' },
        }
      ).then(({ data }) => data);
    })
    .then(
      (fullName) =>
        ({
          key: 'tree-structure',
          valid: true,
          action: () =>
            resource.set('fullName', fullName ?? null, { silent: true }),
        } as const)
    )
    .catch((error) => {
      if (error.message === 'bad-tree-structure' && reportBadStructure)
        return {
          key: 'tree-structure',
          valid: false,
          reason: treeText.badStructure(),
        } as const;
      else throw error;
    });
