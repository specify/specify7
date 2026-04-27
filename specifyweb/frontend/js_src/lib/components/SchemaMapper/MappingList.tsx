import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import type { MappingField, MappingRecord } from './types';

const OCCURRENCE_ID_IRI = 'http://rs.tdwg.org/dwc/terms/occurrenceID';
const OCCURRENCE_ID_FIELD = 'CollectionObject.guid';

export function MappingList({
  mappings,
  onEdit: handleEdit,
  onClone: handleClone,
}: {
  readonly mappings: ReadonlyArray<MappingRecord>;
  readonly onEdit: (id: number) => void;
  readonly onClone: (id: number) => void;
}): JSX.Element {
  return (
    <ul className="flex flex-col gap-1">
      {mappings.map((mapping) => (
        <li
          className="flex items-center justify-between rounded border
            border-gray-300 px-3 py-2 dark:border-neutral-600"
          key={mapping.id}
        >
          <span className="flex items-center gap-2">
            {mapping.isDefault && (
              <span className="text-gray-500" title="Default mapping">
                {icons.key}
              </span>
            )}
            <span>{mapping.name}</span>
          </span>
          <span className="flex gap-2">
            <Button.Icon
              icon="pencil"
              title={commonText.edit()}
              onClick={() => handleEdit(mapping.id)}
            />
            <Button.Icon
              icon="clipboard"
              title={headerText.clone()}
              onClick={() => handleClone(mapping.id)}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders a single mapping field row. For Core mappings, the first row
 * is always the locked occurrenceID row.
 */
export function MappingRow({
  field,
  isLocked,
  onRemove: handleRemove,
  children,
}: {
  readonly field: MappingField;
  readonly isLocked: boolean;
  readonly onRemove: (() => void) | undefined;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className={`flex items-center gap-2 rounded border px-3 py-2 ${
        isLocked
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-neutral-600'
      }`}
    >
      {isLocked && (
        <span
          className="text-blue-500 dark:text-blue-400"
          title={headerText.lockedOccurrenceId()}
        >
          {icons.key}
        </span>
      )}
      <span className="flex-1">
        <span className="font-medium">{field.fieldName}</span>
        {field.term !== undefined && (
          <span className="ml-2 text-sm text-gray-500">{field.term}</span>
        )}
      </span>
      {/*
       * Static value toggle — V2 feature, currently disabled.
       * When field.isStatic is true, a text input would replace the field
       * picker, allowing the user to enter a literal value. Uncomment and
       * enable when the backend supports static values.
       *
       * {field.isStatic && (
       *   <Input.Text
       *     value={field.staticValue ?? ''}
       *     onValueChange={(value) => handleStaticValueChange(value)}
       *   />
       * )}
       */}
      {children}
      {!isLocked && handleRemove !== undefined && (
        <Button.Icon
          icon="x"
          title={commonText.remove()}
          onClick={handleRemove}
        />
      )}
    </div>
  );
}

/**
 * Returns the locked occurrenceID field that must always be the first
 * row in a Core mapping.
 */
export function getLockedOccurrenceIdField(): MappingField {
  return {
    id: -1,
    position: 0,
    stringId: OCCURRENCE_ID_FIELD,
    fieldName: OCCURRENCE_ID_FIELD,
    term: OCCURRENCE_ID_IRI,
    isStatic: false,
    staticValue: undefined,
  };
}
