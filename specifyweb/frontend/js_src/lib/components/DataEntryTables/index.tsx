import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { wbText } from '../../localization/workbench';
import { caseInsensitiveHash } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { getResourceViewUrl } from '../DataModel/resource';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';
import { EditFormTables } from './Edit';
import { useDataEntryTables } from './fetchTables';
import { localized } from '../../utils/types';
import { f } from '../../utils/functools';
import { setCache } from '../../utils/cache';

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
  const tables = useDataEntryTables('form');
  const [isEditing, handleEditing] = useBooleanState();

  const [showTreeDefsDialog, openTreeDefsDialog, closeTreeDefsDialog] =
    useBooleanState();
  const [treeDefsTable, setTreeDefsTable] = React.useState<
    'Taxon' | 'Determination'
  >();

  return isEditing ? (
    <EditFormTables type="form" onClose={handleClose} />
  ) : Array.isArray(tables) ? (
    <Dialog
      buttons={commonText.cancel()}
      className={{ container: dialogClassNames.narrowContainer }}
      header={headerText.dataEntry()}
      headerButtons={<DataEntry.Edit onClick={handleEditing} />}
      icon={icons.pencilAt}
      onClose={handleClose}
    >
      <nav>
        <Ul className="flex flex-col gap-1">
          {tables
            .filter((table) => hasTablePermission(table.name, 'create'))
            .map((table, index) => (
              <li className="contents" key={index}>
                <Link.Default
                  href={
                    f.includes(['Taxon', 'Determination'], table.name)
                      ? undefined
                      : getResourceViewUrl(table.name)
                  }
                  onClick={
                    f.includes(['Taxon', 'Determination'], table.name)
                      ? () => {
                          setTreeDefsTable(
                            table.name as 'Taxon' | 'Determination'
                          );
                          openTreeDefsDialog();
                        }
                      : typeof handleSelected === 'function'
                      ? (event): void => {
                          event.preventDefault();
                          handleSelected(strictGetTable(table.name));
                        }
                      : undefined
                  }
                >
                  <TableIcon label={false} name={table.name} />
                  {table.label}
                </Link.Default>
              </li>
            ))}
        </Ul>
      </nav>
      {showTreeDefsDialog && treeDefsTable !== undefined ? (
        <TreeDefinitionsDialog
          onClose={closeTreeDefsDialog}
          onClick={(treeName: string) => {
            handleSelected?.(strictGetTable(treeDefsTable));
            setCache('dataEntry', 'treeDef', treeName);
            globalThis.location.assign(getResourceViewUrl(treeDefsTable));
          }}
        />
      ) : undefined}
    </Dialog>
  ) : null;
}

// REFACTOR: Consider if this component can be used/replaced with the dialog in PR #5091
function TreeDefinitionsDialog({
  onClose: handleClose,
  onClick: handleClick,
}: {
  readonly onClose: () => void;
  readonly onClick: (treeName: string) => void;
}): JSX.Element {
  const [treeDefinitions] = usePromise(treeRanksPromise, true);
  const definitionsForTreeTaxon = treeDefinitions
    ? caseInsensitiveHash(treeDefinitions, 'Taxon')
    : undefined;
  const definitions = definitionsForTreeTaxon?.map(
    ({ definition }) => definition
  );

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={wbText.selectTree()}
      onClose={handleClose}
    >
      <Ul>
        {definitions?.map(({ name }) => (
          <li key={name} value={name}>
            <Button.LikeLink onClick={() => handleClick(name)}>
              {localized(name)}
            </Button.LikeLink>
          </li>
        ))}
      </Ul>
    </Dialog>
  );
}
