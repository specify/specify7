import { Sortable } from '@shopify/draggable';
import React from 'react';

import { useReadyEffect } from '../../hooks/useReadyEffect';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import type { Tables } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { scrollIntoView } from '../TreeView/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { IsQueryBasicContext } from './Context';
import type { QueryField } from './helpers';
import { queryFieldsToFieldSpecs } from './helpers';
import { QueryLine } from './Line';

export function QueryFields({
  baseTableName,
  fields,
  enforceLengthLimit,
  openedElement,
  showHiddenFields,
  getMappedFields,
  onChangeField: handleChangeField,
  onMappingChange: handleMappingChange,
  onRemoveField: handleRemoveField,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  onLineMove: handleLineMove,
  onOpenMap: handleOpenMap,
  onChangeFields: handleChangeFields,
}: {
  readonly baseTableName: keyof Tables;
  readonly fields: RA<QueryField>;
  readonly enforceLengthLimit: boolean;
  readonly openedElement?: {
    readonly line: number;
    readonly index?: number;
  };
  readonly showHiddenFields: boolean;
  readonly getMappedFields: (mappingPathFilter: MappingPath) => RA<string>;
  readonly onChangeField:
    | ((line: number, field: QueryField) => void)
    | undefined;
  readonly onMappingChange:
    | ((
        line: number,
        payload: {
          readonly index: number;
          readonly newValue: string;
          readonly isRelationship: boolean;
          readonly parentTableName: keyof Tables | undefined;
          readonly currentTableName: keyof Tables | undefined;
          readonly newTableName: keyof Tables | undefined;
          readonly isDoubleClick: boolean;
        }
      ) => void)
    | undefined;
  readonly onRemoveField: ((line: number) => void) | undefined;
  readonly onOpen: ((line: number, index: number) => void) | undefined;
  readonly onClose: (() => void) | undefined;
  readonly onLineFocus: ((line: number) => void) | undefined;
  readonly onLineMove:
    | ((line: number, direction: 'down' | 'up') => void)
    | undefined;
  readonly onOpenMap: ((line: number) => void) | undefined;
  readonly onChangeFields?: ((fields: RA<QueryField>) => void) | undefined;
}): JSX.Element {
  const fieldsContainerRef = React.useRef<HTMLUListElement | null>(null);

  const fieldsRef = React.useRef(fields);
  fieldsRef.current = fields;

  const handleChangeFieldRef = React.useRef(handleChangeFields);
  handleChangeFieldRef.current = handleChangeFields;

  // Draggable and sortable code
  React.useEffect(() => {
    if (handleChangeFieldRef.current === undefined) return;

    if (fieldsContainerRef.current === null) return;
    const sortable = new Sortable(fieldsContainerRef.current, {
      draggable: 'li',
      mirror: {
        appendTo: document.getElementById('portal-root')!,
        constrainDimensions: true,
      },
      distance: 4,
    });

    const interactiveElements = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '.custom-select',
    ];

    sortable.on('sortable:start', (event) => {
      const target = event.dragEvent.originalEvent.target as HTMLElement;
      if (
        interactiveElements.some((element) => target.closest(element) !== null)
      )
        event.cancel();
    });

    sortable.on('mirror:created', (event) => {
      const parentZIndex = findClosestZIndex(event.source);
      if (parentZIndex !== undefined)
        event.mirror.style.zIndex = (parentZIndex + 1).toString();
    });

    sortable.on('sortable:stop', (event) => {
      const newIndex = event.newIndex;
      const oldIndex = event.oldIndex;

      const newItems = Array.from(fieldsRef.current);

      if (oldIndex < newIndex) {
        newItems.splice(newIndex + 1, 0, fieldsRef.current[oldIndex]);
        newItems.splice(oldIndex, 1);
      } else if (oldIndex > newIndex) {
        newItems.splice(newIndex, 0, fieldsRef.current[oldIndex]);
        newItems.splice(oldIndex + 1, 1);
      }

      handleChangeFieldRef.current?.(newItems);
      handleLineFocus?.(newIndex);
    });

    sortable.on('draggable:destroy', () => {
      const mirror = (
        sortable as unknown as { readonly mirror?: Element | null }
      ).mirror;
      mirror?.parentNode?.removeChild(mirror);
    });

    return () => sortable.destroy();
  }, []);

  // Scroll to bottom if added a child
  const oldFieldCount = React.useRef(fields.length);
  // REFACTOR: extract this into hook and use everywhere where applicable
  useReadyEffect(
    React.useCallback(() => {
      if (
        fieldsContainerRef.current !== null &&
        fieldsContainerRef.current.lastChild !== null &&
        fieldsContainerRef.current.clientHeight !==
          fieldsContainerRef.current.scrollHeight &&
        fields.length > oldFieldCount.current
      ) {
        const lastElement = fieldsContainerRef.current.lastChild as HTMLElement;
        const firstNonContentsChild =
          lastElement.querySelector(':not(.contents)');
        scrollIntoView(firstNonContentsChild as HTMLElement, 'nearest');
      }
      oldFieldCount.current = fields.length;
    }, [fields.length])
  );

  const isBasic = React.useContext(IsQueryBasicContext);

  const fieldName = React.useMemo(
    () =>
      queryFieldsToFieldSpecs(baseTableName, fields)
        .map(([_, fieldSpec]) =>
          generateMappingPathPreview(
            fieldSpec.baseTable.name,
            fieldSpec.toMappingPath()
          )
        )
        .join(' '),
    [baseTableName, fields]
  );

  return (
    <Ul
      className={`
          items-center overflow-y-auto sm:flex-1
          ${
            isBasic
              ? 'grid grid-cols-[auto,auto,1fr,auto] content-start items-start gap-x-2 gap-y-2'
              : ''
          }
        `}
      forwardRef={fieldsContainerRef}
    >
      {fields.map((field, line, { length }) => (
        <ErrorBoundary dismissible key={field.id}>
          <li className={`${isBasic ? 'contents' : ''}`} key={line}>
            <QueryLine
              baseTableName={baseTableName}
              enforceLengthLimit={enforceLengthLimit}
              field={field}
              fieldHash={`${line}_${length}`}
              fieldName={fieldName}
              getMappedFields={getMappedFields}
              isFocused={openedElement?.line === line}
              isLast={line === fields.length - 1}
              openedElement={
                openedElement?.line === line ? openedElement?.index : undefined
              }
              showHiddenFields={showHiddenFields}
              onChange={handleChangeField?.bind(undefined, line)}
              onClose={handleClose}
              onLineFocus={(target): void =>
                (target === 'previous' && line === 0) ||
                (target === 'next' && line + 1 >= length)
                  ? undefined
                  : handleLineFocus?.(
                      target === 'previous'
                        ? line - 1
                        : target === 'current'
                          ? line
                          : line + 1
                    )
              }
              onMappingChange={handleMappingChange?.bind(undefined, line)}
              onMoveDown={
                line + 1 === length || handleLineMove === undefined
                  ? undefined
                  : (): void => handleLineMove?.(line, 'down')
              }
              onMoveUp={
                line === 0 || handleLineMove === undefined
                  ? undefined
                  : (): void => handleLineMove?.(line, 'up')
              }
              onOpen={handleOpen?.bind(undefined, line)}
              onOpenMap={handleOpenMap?.bind(undefined, line)}
              onRemove={handleRemoveField?.bind(undefined, line)}
            />
          </li>
        </ErrorBoundary>
      ))}
    </Ul>
  );
}

function findClosestZIndex(element: Element): number | undefined {
  const zIndex = f.parseInt(getComputedStyle(element).zIndex);
  if (typeof zIndex === 'number') return zIndex;
  const parent = element.parentElement ?? undefined;
  return f.maybe(parent, findClosestZIndex);
}
