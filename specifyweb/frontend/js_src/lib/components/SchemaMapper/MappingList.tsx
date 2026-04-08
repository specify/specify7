import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { OCCURRENCE_ID_IRI } from './types';
import type { MappingRecord } from './types';

export function MappingList({
  mappings,
  onEdit: handleEdit,
  onClone: handleClone,
  onDelete: handleDelete,
  onRename: handleRename,
}: {
  readonly mappings: ReadonlyArray<MappingRecord>;
  readonly onEdit: (id: number) => void;
  readonly onClone: (id: number) => void;
  readonly onDelete: (id: number) => void;
  readonly onRename: (id: number, newName: string) => void;
}): JSX.Element {
  return (
    <ul className="flex flex-col gap-1">
      {mappings.map((mapping) => (
        <MappingListItem
          key={mapping.id}
          mapping={mapping}
          onClone={handleClone}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onRename={handleRename}
        />
      ))}
    </ul>
  );
}

function MappingListItem({
  mapping,
  onEdit,
  onClone,
  onDelete,
  onRename,
}: {
  readonly mapping: MappingRecord;
  readonly onEdit: (id: number) => void;
  readonly onClone: (id: number) => void;
  readonly onDelete: (id: number) => void;
  readonly onRename: (id: number, newName: string) => void;
}): JSX.Element {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(mapping.name);

  const commitRename = React.useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== mapping.name) {
      onRename(mapping.id, trimmed);
    }
    setEditing(false);
  }, [draft, mapping.id, mapping.name, onRename]);

  return (
    <li
      className="flex items-center justify-between rounded border
        border-gray-300 px-3 py-2 dark:border-neutral-600"
    >
      <span className="flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            className="rounded border px-1 py-0.5 text-sm"
            value={draft}
            onBlur={commitRename}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraft(mapping.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span
            className="cursor-pointer hover:underline"
            title="Double-click to rename"
            onDoubleClick={() => {
              setDraft(mapping.name);
              setEditing(true);
            }}
          >
            {mapping.name}
          </span>
        )}
        {mapping.unmappedFields > 0 && (
          <span
            className="text-red-600"
            title={`${mapping.unmappedFields} of ${mapping.totalFields} field(s) have no DwC term assigned`}
          >
            {'⚠'}
          </span>
        )}
        {mapping.totalFields === 0 && (
          <span
            className="text-sm text-gray-400"
            title="No fields — add fields in Query Builder"
          >
            {'(empty)'}
          </span>
        )}
      </span>
      <span className="flex gap-2">
        <Button.Icon
          icon="pencil"
          title={commonText.edit()}
          onClick={() => onEdit(mapping.id)}
        />
        <Button.Icon
          icon="clipboard"
          title={headerText.clone()}
          onClick={() => onClone(mapping.id)}
        />
        <Button.Icon
          icon="trash"
          title={commonText.delete()}
          onClick={() => onDelete(mapping.id)}
        />
      </span>
    </li>
  );
}

/**
 * Renders a single mapping field row. For Core mappings, the first row
 * is always the locked occurrenceID row.
 */
export function MappingRow({
  field,
  isLocked,
  isDuplicate = false,
  onRemove: handleRemove,
  children,
}: {
  readonly field: MappingField;
  readonly isLocked: boolean;
  readonly isDuplicate?: boolean;
  readonly onRemove: (() => void) | undefined;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className={`flex items-center gap-2 rounded border px-3 py-2 ${
        isDuplicate
          ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          : 'border-gray-300 dark:border-neutral-600'
      }`}
    >
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
      {isLocked && (
        <span
          className="flex-shrink-0 text-xs text-gray-400"
          title="Required by GBIF — every DwC archive must have an occurrenceID"
        >
          {'required'}
        </span>
      )}
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

