import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { formsText } from '../localization/forms';
import { getResourceViewUrl } from '../resource';
import { schema } from '../schema';
import { toTable } from '../specifymodel';
import { userInformation } from '../userinfo';
import { Input } from './basic';
import { CopyButton } from './common';

export function ShareRecord({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const collectionCode =
    userInformation.availableCollections.find(
      ({ id }) => schema.domainLevelIds.collection === id
    )?.code ?? '';
  const catalogNumber =
    f.maybe(toTable(resource, 'CollectionObject'), (collectionObject) =>
      collectionObject.get('catalogNumber')
    ) ?? '';
  const rawUrl =
    collectionCode.length > 0 && catalogNumber.length > 0
      ? `/specify/bycatalog/${collectionCode}/${catalogNumber}`
      : getResourceViewUrl(
          resource.specifyModel.name,
          resource.id,
          resource.recordsetid
        );
  const url = new URL(rawUrl, globalThis.location.origin).href;
  return (
    <div className="flex flex-col gap-2">
      <h4>{formsText('shareRecord')}</h4>
      <div className="flex gap-2">
        <Input.Text className="!cursor-auto" isReadOnly defaultValue={url} />
        <CopyButton text={url} />
      </div>
    </div>
  );
}
