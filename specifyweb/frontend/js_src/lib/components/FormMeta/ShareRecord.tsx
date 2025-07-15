import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import { Input } from '../Atoms/Form';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { userInformation } from '../InitialContext/userInformation';
import { CopyButton } from '../Molecules/Copy';
import { formatUrl } from '../Router/queryString';

export function ShareRecord({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [recordsetid] = useSearchParameter('recordSetId');
  const recordSetId = f.parseInt(recordsetid);
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
      ? formatUrl(`/specify/bycatalog/${collectionCode}/${catalogNumber}`, {
          recordSetId,
        })
      : getResourceViewUrl(
          resource.specifyTable.name,
          resource.id,
          recordSetId
        );
  const url = new URL(rawUrl, globalThis.location.origin).href;
  return (
    <label className="flex flex-col gap-2">
      {formsText.shareRecord()}
      <div className="flex gap-2">
        <Input.Text className="!cursor-auto" defaultValue={url} isReadOnly />
        <CopyButton text={url} />
      </div>
    </label>
  );
}
