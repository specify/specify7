import React from 'react';

import type { Tables } from '../DataModel/types';
import type { QueryField } from './helpers';
import { scrollIntoView } from '../TreeView/helpers';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { QueryLine } from './Field';
import type { MappingPath } from '../WbPlanView/Mapper';
import { useReadyEffect } from '../../hooks/useReadyEffect';

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
          readonly close: boolean;
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
}): JSX.Element {
  const fieldsContainerRef = React.useRef<HTMLUListElement | null>(null);

  useReadyEffect(
    React.useCallback(
      () =>
        fieldsContainerRef.current !== null &&
        fieldsContainerRef.current.lastChild !== null &&
        fieldsContainerRef.current.clientHeight !==
          fieldsContainerRef.current.scrollHeight
          ? scrollIntoView(
              fieldsContainerRef.current.lastChild as HTMLElement,
              'nearest'
            )
          : undefined,
      [fields.length]
    )
  );

  return (
    <Ul className="flex-1 overflow-y-auto" forwardRef={fieldsContainerRef}>
      {fields.map((field, line, { length }) => (
        <ErrorBoundary dismissable key={field.id}>
          <QueryLine
            baseTableName={baseTableName}
            enforceLengthLimit={enforceLengthLimit}
            field={field}
            fieldHash={`${line}_${length}`}
            getMappedFields={getMappedFields}
            isFocused={openedElement?.line === line}
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
        </ErrorBoundary>
      ))}
    </Ul>
  );
}
