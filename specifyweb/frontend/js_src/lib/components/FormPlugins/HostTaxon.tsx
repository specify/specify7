import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { Input } from '../Atoms/Form';
import { fetchCollection } from '../DataModel/collection';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { CollectingEventAttribute } from '../DataModel/types';
import { QueryComboBox } from '../QueryComboBox';
import type { FormMode, FormType } from '../FormParse';
import { hasTreeAccess } from '../Permissions/helpers';
import { deserializeResource } from '../DataModel/serializers';
import { postProcessTypeSearch, TypeSearch } from '../QueryComboBox/spec';
import { LocalizedString } from 'typesafe-i18n';

const hostTaxonTypeSearch = f.store<TypeSearch>(() =>
  postProcessTypeSearch({
    name: 'HostTaxon' as LocalizedString,
    table: schema.models.Taxon,
    searchFields: ['fullName'],
    displayFields: ['fullName'],
    format: '%s' as LocalizedString,
    formatter: 'Taxon' as LocalizedString,
    query: undefined,
  })
);

export function HostTaxon({
  resource,
  relationship,
  id,
  isRequired,
  mode,
  formType,
}: {
  readonly resource: SpecifyResource<CollectingEventAttribute>;
  readonly relationship: string;
  readonly id: string | undefined;
  readonly isRequired: boolean;
  readonly mode: FormMode;
  readonly formType: FormType;
}): JSX.Element | null {
  const [rightSideCollection] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('CollectionRelType', {
          limit: 1,
          name: relationship,
        })
          .then(async ({ records }) =>
            f
              .maybe(records[0], deserializeResource)
              ?.rgetPromise('rightSideCollection')
          )
          .then((collection) => collection?.get('id')),
      [relationship]
    ),
    false
  );
  return rightSideCollection === undefined ? (
    <Input.Text isReadOnly />
  ) : hasTreeAccess('Taxon', 'read') ? (
    <QueryComboBox
      field={schema.models.CollectingEventAttribute.strictGetRelationship(
        'hostTaxon'
      )}
      forceCollection={rightSideCollection}
      formType={formType}
      id={id}
      isRequired={isRequired}
      mode={mode}
      relatedModel={schema.models.Taxon}
      resource={resource}
      typeSearch={hostTaxonTypeSearch}
    />
  ) : null;
}
