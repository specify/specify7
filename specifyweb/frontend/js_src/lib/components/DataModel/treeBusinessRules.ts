import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { formatUrl } from '../Router/queryString';
import type { BusinessRuleResult } from './businessRules';
import type { AnyTree } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import type { Taxon, TaxonTreeDefItem } from './types';

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
    .then(async ({ parent, definitionItem }) => {
      if (parent === undefined || definitionItem === undefined)
        return undefined;
      if (
        (reportBadStructure && parent.id === resource.id) ||
        parent.get('rankId') >= definitionItem.get('rankId')
      )
        return {
          isValid: false,
          reason: treeText.badStructure(),
        } as const;
      if ((resource.get('name')?.length ?? 0) === 0) return undefined;

      const treeName = resource.specifyTable.name.toLowerCase();
      return ajax(
        formatUrl(
          `/api/specify_tree/${treeName}/${parent.id}/predict_fullname/`,
          {
            name: resource.get('name'),
            treeDefItemId: definitionItem.id,
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
          isValid: true,
          action: () =>
            resource.set('fullName', fullName ?? null, { silent: true }),
        } as const)
    );
