import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import type { GetSet, RA } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { TableIcon } from '../Molecules/TableIcon';
import { DateRange } from './DateRange';

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
  blockers: [blockers, setBlockers],
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly blockers: GetSet<RA<DeleteBlocker>>;
}): JSX.Element {
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
              }).filter(({ ids }) => ids.length > 0)
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

  const table = parentRelationship?.relatedModel ?? directRelationship.model;
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
          })}{' '}
          <DateRange ids={resolvedIds} table={table} />
        </Button.LikeLink>
      </li>
      {isOpen && (
        <RecordSelectorFromIds
          defaultIndex={0}
          dialog="modal"
          headerButtons={undefined}
          ids={resolvedIds}
          isDependent={false}
          mode="edit"
          model={table}
          newResource={undefined}
          title={undefined}
          totalCount={ids.length}
          onAdd={undefined}
          onClone={undefined}
          onClose={handleClose}
          onDelete={handleDeleted}
          onSaved={(resource): void => {
            if (
              parentRelationship === undefined &&
              resource.get(directRelationship.name) !==
                parentResource.get('resource_uri')
            )
              handleDeleted(resolvedIds.indexOf(resource.id));
            handleClose();
          }}
          onSlide={undefined}
        />
      )}
    </>
  );
}
