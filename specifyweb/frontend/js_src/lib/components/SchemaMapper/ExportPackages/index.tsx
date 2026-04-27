import React from 'react';

import { commonText } from '../../../localization/common';
import { headerText } from '../../../localization/header';
import { Button } from '../../Atoms/Button';
import { icons } from '../../Atoms/Icons';
import { Dialog } from '../../Molecules/Dialog';
import { OverlayContext } from '../../Router/Router';

type ExportPackageRecord = {
  readonly id: number;
  readonly exportName: string;
  readonly fileName: string;
  readonly isRss: boolean;
  readonly lastExported: string | undefined;
};

export function ExportPackagesOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const [packages, setPackages] = React.useState<
    ReadonlyArray<ExportPackageRecord>
  >([]);

  React.useEffect(() => {
    fetch('/export/list_export_datasets/')
      .then(async (response) => response.json())
      .then(setPackages)
      .catch(() => {});
  }, []);

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={headerText.exportPackages()}
      icon={icons.archive}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-4">
        {packages.length === 0 ? (
          <p className="text-gray-500">No export packages configured</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {packages.map((pkg) => (
              <li
                className="flex items-center justify-between rounded border p-2"
                key={pkg.id}
              >
                <div>
                  <span className="font-medium">{pkg.exportName}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({pkg.fileName})
                  </span>
                  {pkg.isRss && (
                    <span className="ml-2 rounded bg-blue-100 px-1 text-xs text-blue-800">
                      RSS
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button.Small>Edit</Button.Small>
                  <Button.Small>Clone</Button.Small>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button.Info>New Export Package</Button.Info>
      </div>
    </Dialog>
  );
}
