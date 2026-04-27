import React from 'react';

import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import type { MappingRecord } from './types';

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
              title="Clone"
              onClick={() => handleClone(mapping.id)}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
