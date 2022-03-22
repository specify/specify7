import React from 'react';

import type { Tables } from '../datamodel';
import type { QueryField } from '../querybuilderutils';
import { scrollIntoView } from '../treeviewutils';
import type { RA } from '../types';
import { Ul } from './basic';
import { QueryLine } from './querybuilderfield';
import type { MappingPath } from './wbplanviewmapper';
import { useReadyEffect } from './hooks';

export function QueryFields({
  baseTableName,
  fields,
  onChangeField: handleChangeField,
  onMappingChange: handleMappingChange,
  onRemoveField: handleRemoveField,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  onLineMove: handleLineMove,
  openedElement,
  showHiddenFields,
  getMappedFields,
}: {
  readonly baseTableName: keyof Tables;
  readonly fields: RA<QueryField>;
  readonly onChangeField: (line: number, field: QueryField) => void;
  readonly onMappingChange: (
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
  ) => void;
  readonly onRemoveField: (line: number) => void;
  readonly onOpen: (line: number, index: number) => void;
  readonly onClose: () => void;
  readonly onLineFocus: (line: number) => void;
  readonly onLineMove: (line: number, direction: 'up' | 'down') => void;
  readonly openedElement?: {
    readonly line: number;
    readonly index?: number;
  };
  readonly showHiddenFields: boolean;
  readonly getMappedFields: (mappingPathFilter: MappingPath) => RA<string>;
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
        <QueryLine
          key={field.id}
          fieldHash={`${line}_${length}`}
          baseTableName={baseTableName}
          field={field}
          onChange={(newField): void => handleChangeField(line, newField)}
          onMappingChange={(payload): void =>
            handleMappingChange(line, payload)
          }
          onRemove={(): void => handleRemoveField(line)}
          onOpen={handleOpen.bind(undefined, line)}
          onClose={handleClose}
          onLineFocus={(target): void =>
            (target === 'previous' && line === 0) ||
            (target === 'next' && line + 1 >= length)
              ? undefined
              : handleLineFocus(
                  target === 'previous'
                    ? line - 1
                    : target === 'current'
                    ? line
                    : line + 1
                )
          }
          onMoveUp={
            line === 0 ? undefined : (): void => handleLineMove(line, 'up')
          }
          onMoveDown={
            line + 1 === length
              ? undefined
              : (): void => handleLineMove(line, 'down')
          }
          showHiddenFields={showHiddenFields}
          isFocused={openedElement?.line === line}
          openedElement={
            openedElement?.line === line ? openedElement?.index : undefined
          }
          getMappedFields={getMappedFields}
        />
      ))}
    </Ul>
  );
}
