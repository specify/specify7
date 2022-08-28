import React from 'react';

import type { AnySchema } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { formsText } from '../../localization/forms';
import { getResourceViewUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { toTable } from '../DataModel/specifyModel';
import { userInformation } from '../InitialContext/userInformation';
import { Input } from '../Atoms/Form';
import { CopyButton } from '../Molecules';

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
        <Input.Text className="!cursor-auto" defaultValue={url} isReadOnly />
        <CopyButton text={url} />
      </div>
    </div>
  );
}
