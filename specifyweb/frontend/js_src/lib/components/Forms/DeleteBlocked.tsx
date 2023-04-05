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
import type { SpecifyModel } from '../DataModel/specifyModel';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { TableIcon } from '../Molecules/TableIcon';
import { DateRange } from './DateRange';

export type DeleteBlocker = {
  readonly table: SpecifyModel;
  readonly blockers: RA<{
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
        <TableBlockersPreview
          blocker={blocker}
          key={blockerIndex}
          parentResource={parentResource}
          onDeleted={(relationshipIndex, resourceIndex): void =>
            setBlockers(
              replaceItem(blockers, blockerIndex, {
                ...blockers[blockerIndex],
                blockers: replaceItem(
                  blockers[blockerIndex].blockers,
                  blockerIndex,
                  {
                    ...blockers[blockerIndex].blockers[relationshipIndex],
                    ids: removeItem(
                      blockers[blockerIndex].blockers[relationshipIndex].ids,
                      resourceIndex
                    ),
                  }
                ).filter(({ ids }) => ids.length > 0),
              }).filter(({ blockers }) => blockers.length > 0)
            )
          }
        />
      ))}
    </Ul>
  );
}

function TableBlockersPreview({
  blocker: { table, blockers },
  parentResource,
  onDeleted: handleDeleted,
}: {
  readonly blocker: DeleteBlocker;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly onDeleted: (
    relationshipIndex: number,
    resourceIndex: number
  ) => void;
}): JSX.Element {
  const label = (
    <>
      <TableIcon label name={table.name} />
      {commonText.countLine({
        resource: table.label,
        count: blockers.flatMap(({ ids }) => ids).length,
      })}
    </>
  );

  return (
    <li className="flex flex-col gap-2">
      {blockers.length === 1 ? (
        <BlockerPreview
          blocker={blockers[0]}
          includeTableName
          parentResource={parentResource}
          onDeleted={(resourceIndex): void => handleDeleted(0, resourceIndex)}
        />
      ) : (
        <details>
          <summary className="list-none">
            <div className="flex items-center gap-2">{label}</div>
          </summary>
          <Ul className="flex flex-col gap-2 pl-4 pt-1">
            {blockers.map((blocker, blockerIndex) => (
              <BlockerPreview
                blocker={blocker}
                includeTableName={false}
                key={blockerIndex}
                parentResource={parentResource}
                onDeleted={(resourceIndex): void =>
                  handleDeleted(0, resourceIndex)
                }
              />
            ))}
          </Ul>
        </details>
      )}
    </li>
  );
}

function BlockerPreview({
  blocker: { directRelationship, parentRelationship, ids },
  parentResource,
  includeTableName,
  onDeleted: handleDeleted,
}: {
  readonly blocker: DeleteBlocker['blockers'][number];
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly includeTableName: boolean;
  readonly onDeleted: (resourceIndex: number) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resolvedIds = React.useMemo(
    () => ids.map(({ direct, parent = direct }) => parent),
    [ids]
  );
  const table = parentRelationship?.relatedModel ?? directRelationship.model;
  return (
    <>
      <Button.LikeLink onClick={handleOpen}>
        {includeTableName && <TableIcon label name={table.name} />}
        {commonText.countLine({
          resource: includeTableName
            ? table.name
            : parentRelationship?.label ?? directRelationship.label,
          count: ids.length,
        })}{' '}
        <DateRange ids={resolvedIds} table={table} />
      </Button.LikeLink>
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
