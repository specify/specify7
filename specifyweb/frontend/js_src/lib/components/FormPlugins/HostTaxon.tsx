import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { Input } from '../Atoms/Form';
import { fetchCollection } from '../DataModel/collection';
import { deserializeResource } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { CollectingEventAttribute } from '../DataModel/types';
import { QueryComboBox } from '../FormFields/QueryComboBox';
import type { FormMode, FormType } from '../FormParse';
import { hasTreeAccess } from '../Permissions/helpers';

const template = document.createElement('template');
template.innerHTML =
  '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>';
const hostTaxonTypeSearch = template.content.firstChild! as Element;

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
          .then((collection) => collection?.get('id') ?? false),
      [relationship]
    ),
    false
  );

  return hasTreeAccess('Taxon', 'read') ? (
    typeof rightSideCollection === 'number' ? (
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
    ) : (
      <Input.Text
        isReadOnly
        value={rightSideCollection === false ? undefined : commonText.loading()}
      />
    )
  ) : null;
}
