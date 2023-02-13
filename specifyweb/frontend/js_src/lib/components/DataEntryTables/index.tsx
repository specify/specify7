import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Ul } from '../Atoms';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { getResourceViewUrl } from '../DataModel/resource';
import { strictGetTable } from '../DataModel/tables';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';
import { EditFormTables } from './Edit';
import { useDataEntryForms } from './fetch';

export function FormsDialogOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <FormsDialog onClose={handleClose} />;
}

/**
 * A dialog presenting a list of data forms
 */
export function FormsDialog({
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly onSelected?: (table: SpecifyTable) => void;
  readonly onClose: () => void;
}): JSX.Element | null {
  const forms = useDataEntryForms();
  const [isEditing, handleEditing] = useBooleanState();

  return isEditing ? (
    <EditFormTables onClose={handleClose} />
  ) : Array.isArray(forms) ? (
    <Dialog
      buttons={commonText.cancel()}
      className={{ container: dialogClassNames.narrowContainer }}
      header={headerText.dataEntry()}
      headerButtons={<DataEntry.Edit onClick={handleEditing} />}
      icon={<span className="text-blue-500">{icons.pencilAt}</span>}
      onClose={handleClose}
    >
      <nav>
        <Ul className="flex flex-col gap-1">
          {forms
            .filter(({ table }) => hasTablePermission(table.name, 'create'))
            .map(({ table, title = table.label, icon = table.name }, index) => (
              <li className="contents" key={index}>
                <Link.Default
                  href={getResourceViewUrl(table.name)}
                  onClick={
                    typeof handleSelected === 'function'
                      ? (event): void => {
                          event.preventDefault();
                          handleSelected(strictGetTable(table.name));
                        }
                      : undefined
                  }
                >
                  <TableIcon label={false} name={icon} />
                  {title}
                </Link.Default>
              </li>
            ))}
        </Ul>
      </nav>
    </Dialog>
  ) : null;
}
