import React from 'react';

import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { FormMode, FormType } from '../FormParse';
import { hasTreeAccess } from '../Permissions/helpers';
import { schema } from '../DataModel/schema';
import { defined } from '../../utils/types';
import { Input } from '../Atoms/Form';
import { QueryComboBox } from '../FormFields/QueryComboBox';
import { deserializeResource } from '../../hooks/resource';
import {useAsyncState} from '../../hooks/useAsyncState';

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

export function HostTaxon({
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
      fieldName={undefined}
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
