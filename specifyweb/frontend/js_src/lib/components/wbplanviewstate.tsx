import React from 'react';

import { ajax } from '../ajax';
import type { Tables } from '../datamodel';
import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import type { RA } from '../types';
import type { UploadPlan } from '../uploadplanparser';
import { Button, Input, Label } from './basic';
import { LoadingContext } from './contexts';
import { useBooleanState } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { useCachedState } from './statecache';
import { WbsDialog } from './toolbar/wbsdialog';
import type { Dataset } from './wbplanview';
import { ListOfBaseTables } from './wbplanviewcomponents';

function TemplateSelection({
  headers,
  onClose: handleClose,
  onSelect: handleSelect,
}: {
  readonly headers: RA<string>;
  readonly onClose: () => void;
  readonly onSelect: (uploadPlan: UploadPlan, headers: RA<string>) => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);

  const [isInvalid, handleInvalid, handleValid] = useBooleanState();

  return (
    <>
      {isInvalid && (
        <Dialog
          header={wbText('noUploadPlanDialogHeader')}
          onClose={handleValid}
          buttons={commonText('close')}
        >
          {wbText('invalidTemplateDialogText')}
        </Dialog>
      )}
      <WbsDialog
        showTemplates={true}
        onClose={handleClose}
        onDataSetSelect={(id: number): void =>
          loading(
            ajax<Dataset>(`/api/workbench/dataset/${id}`, {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              headers: { Accept: 'application/json' },
            }).then(({ data: { uploadplan, columns, visualorder } }) =>
              uploadplan === null
                ? handleInvalid()
                : handleSelect(
                    uploadplan,
                    headers.length === 0 && Array.isArray(visualorder)
                      ? visualorder.map((visualCol) => columns[visualCol])
                      : headers
                  )
            )
          )
        }
      />
    </>
  );
}

export function BaseTableSelection({
  onClose: handleClose,
  onSelectTemplate: handleSelectTemplate,
  onSelected: handleSelected,
  headers,
}: {
  readonly onClose: () => void;
  readonly onSelectTemplate: (
    uploadPlan: UploadPlan,
    headers: RA<string>
  ) => void;
  readonly onSelected: (baseTableName: keyof Tables) => void;
  readonly headers: RA<string>;
}): JSX.Element {
  const [showHiddenTables = true, setShowHiddenTables] = useCachedState({
    bucketName: 'wbPlanViewUi',
    cacheName: 'showHiddenTables',
    defaultValue: true,
    staleWhileRefresh: false,
  });

  const [useTemplate, handleUseTemplate, handleDontUseTemplate] =
    useBooleanState();

  return useTemplate ? (
    <TemplateSelection
      headers={headers}
      onClose={handleDontUseTemplate}
      onSelect={handleSelectTemplate}
    />
  ) : (
    <Dialog
      header={wbText('selectBaseTableDialogTitle')}
      onClose={handleClose}
      className={{
        container: `${dialogClassNames.narrowContainer} h-1/2`,
      }}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Blue onClick={handleUseTemplate}>
            {wbText('chooseExistingPlan')}
          </Button.Blue>
        </>
      }
    >
      <ListOfBaseTables
        showHiddenTables={showHiddenTables}
        onChange={handleSelected}
      />
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={showHiddenTables}
          onChange={(): void => setShowHiddenTables(!showHiddenTables)}
        />
        {wbText('showAdvancedTables')}
      </Label.ForCheckbox>
    </Dialog>
  );
}
