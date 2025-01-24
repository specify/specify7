import React from 'react';

import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import type { DeepPartial } from '../../utils/types';
import { localized } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import type {
  AnySchema,
  AnyTree,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { TaxonTreeDef } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import type { TreeInformation } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { defaultTreeDefs } from './defaults';

export function CreateTree<
  SCHEMA extends AnyTree,
  TREE_NAME extends AnyTree['tableName'],
>({
  tableName,
  treeDefinitions,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefinitions: TreeInformation[TREE_NAME];
}): JSX.Element {
  const treeNameArray = treeDefinitions.map((tree) => tree.definition.name);

  const [isActive, setIsActive] = React.useState(0);

  const [selectedResource, setSelectedResource] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  const handleClick = (
    resource: DeepPartial<SerializedResource<TaxonTreeDef>>
  ) => {
    const uniqueName = getUniqueName(
      resource.name!,
      treeNameArray,
      Number.POSITIVE_INFINITY,
      'name'
    );
    const dsResource = deserializeResource(resource);
    dsResource.set('name', uniqueName as never);
    setSelectedResource(dsResource);
    setIsActive(2);
  };

  return (
    <>
      {tableName === 'Taxon' && userInformation.isadmin ? (
        <Button.Icon
          className={className.dataEntryAdd}
          icon="plus"
          title={treeText.addTree()}
          onClick={() => {
            setIsActive(1);
          }}
        />
      ) : null}
      {isActive === 1 ? (
        <Dialog
          buttons={
            <Button.DialogClose component={Button.BorderedGray}>
              {commonText.cancel()}
            </Button.DialogClose>
          }
          header={treeText.addTree()}
          onClose={() => setIsActive(0)}
        >
          <Ul className="flex flex-col gap-2">
            {defaultTreeDefs.map((resource, index) => (
              <li key={index}>
                <Button.LikeLink onClick={(): void => handleClick(resource)}>
                  {localized(resource.name)}
                </Button.LikeLink>
              </li>
            ))}
          </Ul>
        </Dialog>
      ) : null}
      {isActive === 2 && selectedResource !== undefined ? (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={selectedResource}
          onAdd={undefined}
          onClose={() => setIsActive(0)}
          onDeleted={undefined}
          onSaved={(): void => globalThis.location.reload()}
        />
      ) : null}
    </>
  );
}
