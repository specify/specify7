import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { GetOrSet, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import {
  insertItem,
  moveItem,
  removeItem,
  replaceItem,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyModel';
import type { Accession } from '../DataModel/types';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { resourceToGeneric } from './autoMerge';
import {
  CompareField,
  MergeButton,
  MergeContainer,
  useMergeConformation,
} from './Compare';
import { mergeCellBackground, mergeHeaderClassName } from './Header';
import { MergeDialogContainer } from './index';
import { f } from '../../utils/functools';

export function MergeSubviewButton({
  relationship,
  resource,
  resources,
  merged,
}: {
  readonly relationship: Relationship;
  readonly resource: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const getCount = React.useCallback(
    () =>
      relationshipIsToMany(relationship)
        ? (resource as SpecifyResource<Accession>).getDependentResource(
            relationship.name as 'accessionAgents'
          )?.models.length ?? 0
        : resource.get(relationship.name) === undefined
        ? 0
        : 1,
    [relationship, resource]
  );
  const [count, setCount] = React.useState(getCount);
  React.useEffect(
    () =>
      resourceOn(
        resource,
        `change:${relationship.name}`,
        () => setCount(getCount()),
        true
      ),
    [resource, relationship, getCount]
  );
  return (
    <>
      <Button.Gray
        aria-pressed={isOpen}
        className="flex-1"
        onClick={handleOpen}
      >
        {queryText('nRecords', count)}
      </Button.Gray>
      {isOpen && (
        <MergeDialog
          merged={merged ?? resource}
          relationship={relationship}
          resources={resources}
          onClose={handleClose}
        />
      )}
    </>
  );
}

function MergeDialog({
  relationship,
  merged,
  resources,
  onClose: handleClose,
}: {
  readonly relationship: Relationship;
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('merge-dialog');

  const getChildren = React.useCallback(
    (resource: SpecifyResource<AnySchema>) => {
      const children = resource.getDependentResource(relationship.name);
      return relationshipIsToMany(relationship)
        ? (children as Collection<AnySchema> | undefined)?.models ?? []
        : filterArray([children]);
    },
    [relationship]
  );

  const [mergedRecords, setMergedRecords] = React.useState(() =>
    getChildren(merged)
  );

  const [children, setChildren] = useChildren(
    mergedRecords,
    getChildren,
    resources,
    relationship
  );
  const maxCount = Math.max(
    ...[mergedRecords, ...children].map((children) => children.length)
  );

  // This is ugly, but will be removed once we get rid of Backbone
  React.useEffect(() => {
    if (relationshipIsToMany(relationship))
      merged.set(relationship.name, mergedRecords as never);
    else merged.set(relationship.name, mergedRecords[0] as never);
  }, [merged, relationship, mergedRecords]);

  return (
    <MergeDialogContainer
      header={queryText('mergeFields', relationship.label)}
      id={id('form')}
      onCancel={undefined}
      onClose={handleClose}
    >
      <MergeContainer
        id={id('form')}
        recordCount={resources.length}
        onSubmit={handleClose}
      >
        <thead>
          <tr>
            <td className={mergeHeaderClassName} />
            <th className={mergeHeaderClassName} scope="col">
              {queryText('mergedRecord')}
            </th>
            {resources.map((_, index) => (
              <th className={mergeHeaderClassName} key={index} scope="col">
                {queryText('duplicateRecord', index + 1)}
              </th>
            ))}
          </tr>
        </thead>
        {Array.from({ length: maxCount }, (_, index) => (
          <SubViewLine
            isFirst={index === 0}
            isLast={index + 1 === maxCount}
            key={index}
            merged={mergedRecords[index]}
            resources={children.map((record) => record[index])}
            onRemove={(): void =>
              setMergedRecords(removeItem(mergedRecords, index))
            }
            onSlide={(columnIndex, direction): void => {
              if (columnIndex === 0)
                setMergedRecords(moveItem(mergedRecords, index, direction));
              else
                setChildren(
                  replaceItem(
                    children,
                    columnIndex - 1,
                    moveItem(
                      direction === 'down' &&
                        index + 1 === children[columnIndex - 1].length
                        ? insertItem(
                            children[columnIndex - 1],
                            index + 1,
                            undefined
                          )
                        : children[columnIndex - 1],
                      index,
                      direction
                    )
                  )
                );
            }}
          />
        ))}
        <tbody>
          <tr>
            <td />
            <td>
              <Button.Green
                className="flex-1"
                onClick={(): void =>
                  setMergedRecords([
                    ...mergedRecords,
                    new relationship.relatedModel.Resource(),
                  ])
                }
              >
                {commonText('add')}
              </Button.Green>
            </td>
          </tr>
        </tbody>
      </MergeContainer>
    </MergeDialogContainer>
  );
}

/**
 * Try to map each of the children to some of the records in the merged
 * resource (using exact match), without replacement
 */
function useChildren(
  mergedRecords: RA<SpecifyResource<AnySchema>>,
  getChildren: (
    resource: SpecifyResource<AnySchema>
  ) => RA<SpecifyResource<AnySchema>>,
  resources: RA<SpecifyResource<AnySchema> | undefined>,
  relationship: Relationship
): GetOrSet<RA<RA<SpecifyResource<AnySchema> | undefined>>> {
  return useTriggerState(
    React.useMemo<RA<RA<SpecifyResource<AnySchema> | undefined>>>(() => {
      const children = resources.map((record) => f.maybe(record, getChildren));
      const maxCount = Math.max(
        ...[mergedRecords, ...children].map((children) => children?.length ?? 0)
      );
      return children
        .map((records) =>
          records?.reduce<
            readonly [
              RR<number, SpecifyResource<AnySchema>>,
              RA<string | undefined>
            ]
          >(
            ([mappings, mergedRecords], record) => {
              const serialized = JSON.stringify(
                resourceToGeneric(record.toJSON())
              );
              const matchIndex = mergedRecords.indexOf(serialized);
              return [
                { ...mappings, [matchIndex]: record },
                matchIndex === -1
                  ? mergedRecords
                  : removeItem(mergedRecords, matchIndex),
              ];
            },
            [
              {},
              mergedRecords
                .map((record) => resourceToGeneric(record.toJSON()))
                .map((resource) => JSON.stringify(resource)),
            ]
          )
        )
        .map((results, index) => {
          if (results === undefined) return [];
          const [mappings] = results;
          const mapped = new Set(Object.values(mappings));
          return [
            ...Array.from({ length: maxCount }, (_, index) => mappings[index]),
            ...(children[index]?.filter((record) => !mapped.has(record)) ?? []),
          ];
        });
    }, [getChildren, resources, relationship])
  );
}

function SubViewLine({
  isFirst,
  isLast,
  merged,
  resources,
  onRemove: handleRemove,
  onSlide: handleSlide,
}: {
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly onRemove: () => void;
  readonly onSlide: (index: number, direction: 'down' | 'up') => void;
}): JSX.Element | null {
  const isEmpty =
    merged === undefined &&
    resources.every((resource) => resource === undefined);
  return isEmpty ? null : (
    <tbody>
      <SubViewHeader
        isFirst={isFirst}
        isLast={isLast}
        merged={merged}
        resources={resources}
        onRemove={handleRemove}
        onSlide={handleSlide}
      />
      <SubViewBody merged={merged} resources={resources} />
      <tr aria-hidden>
        <td className="col-span-full my-8 border p-0" />
      </tr>
    </tbody>
  );
}

function SubViewHeader({
  isFirst,
  isLast,
  merged,
  resources,
  onRemove: handleRemove,
  onSlide: handleSlide,
}: {
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly onRemove: () => void;
  readonly onSlide: (index: number, direction: 'down' | 'up') => void;
}): JSX.Element {
  return (
    <tr>
      <th className={mergeCellBackground} scope="row">
        <span className="sr-only">{queryText('subViewControls')}</span>
      </th>
      {[merged, ...resources].map((resource, index) =>
        resource === undefined ? (
          <td key={index} />
        ) : (
          <td className="!items-stretch" key={index}>
            {index === 0 ? (
              <Button.Small
                variant={className.redButton}
                onClick={handleRemove}
              >
                {icons.trash}
              </Button.Small>
            ) : merged === undefined ? undefined : (
              <MergeButton field={undefined} from={resource} to={merged} />
            )}
            <Button.Blue
              className="flex-1"
              disabled={isFirst}
              onClick={(): void => handleSlide(index, 'up')}
            >
              {icons.chevronUp}
            </Button.Blue>
            <Button.Blue
              className="flex-1"
              disabled={isLast}
              onClick={(): void => handleSlide(index, 'down')}
            >
              {icons.chevronDown}
            </Button.Blue>
          </td>
        )
      )}
    </tr>
  );
}

/*
 * There is an assumption that either "merged" is defined, or one of the
 * "resources" is defined.
 */
function SubViewBody({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
}): JSX.Element {
  const conformation = useMergeConformation(
    filterArray([merged, ...resources])[0].specifyModel,
    React.useMemo(() => {
      const records = filterArray(resources);
      return records.length === 0 ? [merged!] : records;
    }, [resources, merged])
  );

  return (
    <>
      {conformation.map((field) => (
        <CompareField
          field={field}
          key={field.name}
          merged={merged}
          resources={resources}
        />
      ))}
    </>
  );
}
