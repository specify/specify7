import React from 'react';

import type { Tables } from '../datamodel';
import type { QueryField } from '../querybuilderutils';
import type { RA } from '../types';
import { Ul } from './basic';
import { QueryLine } from './querybuilderfield';

export function QueryFields({
  baseTableName,
  fields,
  onChangeField: handleChangeField,
  onRemoveField: handleRemoveField,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  openedElement,
  showHiddenFields,
}: {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly fields: RA<QueryField>;
  readonly onChangeField: (line: number, field: QueryField) => void;
  readonly onRemoveField: (line: number) => void;
  readonly onOpen: (line: number, index: number) => void;
  readonly onClose: () => void;
  readonly onLineFocus: (line: number) => void;
  readonly openedElement?: {
    readonly line: number;
    readonly index?: number;
  };
  readonly showHiddenFields: boolean;
}): JSX.Element {
  return (
    <Ul>
      {fields.map((field, line) => (
        <QueryLine
          key={field.id}
          baseTableName={baseTableName}
          field={field}
          forReport={false}
          onChange={(newField): void => handleChangeField(line, newField)}
          onRemove={(): void => handleRemoveField(line)}
          onOpen={handleOpen.bind(undefined, line)}
          onClose={handleClose}
          onLineFocus={(target): void =>
            (target === 'previous' && line === 0) ||
            (target === 'current' && line + 1 == fields.length)
              ? undefined
              : handleLineFocus(
                  target === 'previous'
                    ? line - 1
                    : target === 'current'
                    ? line
                    : line + 1
                )
          }
          showHiddenFields={showHiddenFields}
          isFocused={openedElement?.line === line}
          openedElement={openedElement?.index}
        />
      ))}
    </Ul>
  );
}
