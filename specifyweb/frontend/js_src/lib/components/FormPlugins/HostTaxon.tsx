import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { defined } from '../../utils/types';
import { Input } from '../Atoms/Form';
import { fetchCollection } from '../DataModel/collection';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { CollectingEventAttribute } from '../DataModel/types';
import type { FormMode, FormType } from '../FormParse';
import { hasTreeAccess } from '../Permissions/helpers';
import { QueryComboBox } from '../QueryComboBox';
import type { TypeSearch } from '../QueryComboBox/spec';
import { postProcessTypeSearch } from '../QueryComboBox/spec';
import { tables } from '../DataModel/tables';

const hostTaxonTypeSearch = f.store<TypeSearch>(() =>
  defined(
    postProcessTypeSearch({
      name: 'HostTaxon' as LocalizedString,
      table: tables.Taxon,
      searchFields: ['fullName'],
      displayFields: ['fullName'],
      format: '%s' as LocalizedString,
      formatter: 'Taxon' as LocalizedString,
      query: undefined,
    }),
    'Unable to parse host taxon type search'
  )
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
      field={tables.CollectingEventAttribute.strictGetRelationship('hostTaxon')}
      forceCollection={rightSideCollection}
      formType={formType}
      id={id}
      isRequired={isRequired}
      mode={mode}
      relatedTable={tables.Taxon}
      resource={resource}
      typeSearch={hostTaxonTypeSearch()}
    />
  ) : null;
}
