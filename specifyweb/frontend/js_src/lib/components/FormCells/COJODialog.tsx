import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { localized } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import { tables } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';

export function COJODialog(): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const COJOChildrentables = [
    tables.CollectionObject,
    tables.CollectionObjectGroup,
  ];
  return (
    <>
      <DataEntry.Add onClick={handleOpen} />
      {isOpen && (
        <Dialog
          buttons={commonText.cancel()}
          dimensionsKey="COGChildren"
          header={formsText.addCOGChildren()}
          onClose={handleClose}
        >
          <div className="flex flex-col gap-4">
            {COJOChildrentables.map((table) => (
              <div className="flex items-center gap-2" key={table.name}>
                <TableIcon label name={table.name} />
                {localized(table.label)}
                <DataEntry.Add onClick={undefined} />
                <DataEntry.Search aria-pressed="true" onClick={undefined} />
              </div>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
