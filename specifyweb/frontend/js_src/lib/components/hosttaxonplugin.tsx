import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { schema } from '../schema';
import { Input } from './basic';
import { useAsyncState } from './hooks';

// FIXME: rewrite QueryCbx to React
const hostTaxonTypesearch = $.parseXML(
  '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>'
);

export function HostTaxonPlugin({
  resource,
  relationship,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly relationship: string;
}): JSX.Element {
  const [rightSideCollection] = useAsyncState(
    React.useCallback(async () => {
      const collection = new schema.models.CollectionRelType.LazyCollection({
        filters: { name: relationship },
      });
      return collection
        .fetchPromise({ limit: 1 })
        .then(async ({ models }) =>
          models[0]?.rgetPromise('rightSideCollection')
        )
        .then((collection) => collection?.get('id'));
    }, [relationship])
  );
  return typeof rightSideCollection === 'undefined' ? (
    <Input.Text readOnly />
  ) : (
    <QueryComboBox
      resource={resource}
      relatedModel={schema.models.Taxon}
      forceCollection={rightSideCollection}
      showButtons={false}
      /*
       * Init: {},
       * typesearch: $('typesearch', hostTaxonTypesearch),
       */
    />
  );
}
