import React from 'react';

import { fetchCollection } from '../collection';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode, FormType } from '../parseform';
import { hasTreeAccess } from '../permissionutils';
import { schema } from '../schema';
import { defined } from '../types';
import { Input } from './basic';
import { useAsyncState } from './hooks';
import { QueryComboBox } from './querycombobox';
import { deserializeResource } from './resource';

const template =
  typeof document === 'object' ? document.createElement('template') : undefined;
if (typeof template === 'object')
  template.innerHTML =
    '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>';
const hostTaxonTypeSearch = (
  typeof template === 'object'
    ? defined(template.content.firstChild ?? undefined)
    : undefined
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
  return rightSideCollection === undefined ? (
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
