import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode, FormType } from '../parseform';
import { schema } from '../schema';
import { defined } from '../types';
import { Input } from './basic';
import { useAsyncState } from './hooks';
import { QueryComboBox } from './querycombobox';
import { f } from '../functools';
import { fetchCollection } from '../collection';
import { deserializeResource } from './resource';
import { hasTreeAccess } from '../permissions';

const template = document.createElement('template');
template.innerHTML =
  '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>';
const hostTaxonTypeSearch = defined(
  template.content.firstChild ?? undefined
) as Element;

export function HostTaxonPlugin({
  resource,
  relationship,
  id,
  isRequired,
  mode,
  formType,
}: {
  readonly resource: SpecifyResource<AnySchema>;
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
  return typeof rightSideCollection === 'undefined' ? (
    <Input.Text isReadOnly />
  ) : hasTreeAccess('Taxon', 'read') ? (
    <QueryComboBox
      id={id}
      fieldName={undefined}
      resource={resource}
      forceCollection={rightSideCollection}
      relatedModel={schema.models.Taxon}
      isRequired={isRequired}
      mode={mode}
      formType={formType}
      typeSearch={hostTaxonTypeSearch}
    />
  ) : null;
}
