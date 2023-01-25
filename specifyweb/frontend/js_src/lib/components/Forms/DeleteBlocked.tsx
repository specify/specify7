import React from 'react';

import { commonText } from '../../localization/common';
import { RA } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import { TableIcon } from '../Molecules/TableIcon';
import { Ul } from '../Atoms';
import { useTriggerState } from '../../hooks/useTriggerState';
import { Button } from '../Atoms/Button';
import { removeItem, replaceItem } from '../../utils/utils';
import { useBooleanState } from '../../hooks/useBooleanState';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';

export type DeleteBlocker = {
  readonly directRelationship: Relationship;
  readonly parentRelationship: Relationship | undefined;
  readonly ids: RA<{
    /*
     * Blocker might be for "Determiner", but we would resolve it to
     * "Determination" as that is a more interesting table.
     */
    readonly direct: number;
    readonly parent: number | undefined;
  }>;
};

export function DeleteBlockers({
  resource: parentResource,
  blockers: initialBlockers,
  onCleared: handleCleared,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly blockers: RA<DeleteBlocker>;
  readonly onCleared: () => void;
}): JSX.Element {
  const [blockers, setBlockers] = useTriggerState(initialBlockers);
  React.useEffect(
    () =>
      Array.isArray(blockers) && blockers.length === 0
        ? handleCleared()
        : undefined,
    [blockers, handleCleared]
  );

  return (
    <Ul className="flex flex-col gap-2">
      {blockers.map((blocker, blockerIndex) => (
        <BlockerPreview
          blocker={blocker}
          key={blockerIndex}
          parentResource={parentResource}
          onDeleted={(resourceIndex): void =>
            setBlockers(
              replaceItem(blockers, blockerIndex, {
                ...blockers[blockerIndex],
                ids: removeItem(blockers[blockerIndex].ids, resourceIndex),
              })
            )
          }
        />
      ))}
    </Ul>
  );
}

function BlockerPreview({
  blocker: { directRelationship, parentRelationship, ids },
  parentResource,
  onDeleted: handleDeleted,
}: {
  readonly blocker: DeleteBlocker;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly onDeleted: (index: number) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resolvedIds = React.useMemo(
    () => ids.map(({ direct, parent = direct }) => parent),
    [ids]
  );

  return (
    <>
      <li>
        <Button.LikeLink onClick={handleOpen}>
          <TableIcon
            label
            name={
              parentRelationship?.relatedModel.name ??
              directRelationship.model.name
            }
          />
          {commonText.countLine({
            resource:
              parentRelationship === undefined
                ? `${directRelationship.model.label} - ${directRelationship.label}`
                : `${parentRelationship.label} - ${parentRelationship.model.label}`,
            count: ids.length,
          })}
        </Button.LikeLink>
      </li>
      {isOpen && (
        <RecordSelectorFromIds
          ids={resolvedIds}
          newResource={undefined}
          defaultIndex={0}
          title={undefined}
          headerButtons={undefined}
          dialog="modal"
          isDependent={false}
          mode="edit"
          onClose={handleClose}
          onClone={undefined}
          model={parentRelationship?.relatedModel ?? directRelationship.model}
          onAdd={undefined}
          onDelete={handleDeleted}
          onSlide={undefined}
          onSaved={(resource): void => {
            if (
              parentRelationship === undefined &&
              resource.get(directRelationship.name) !==
                parentResource.get('resource_uri')
            )
              handleDeleted(resolvedIds.indexOf(resource.id));
            handleClose();
          }}
          totalCount={ids.length}
        />
      )}
    </>
  );
}
