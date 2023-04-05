import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import type { Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { DataSetsDialog } from '../Toolbar/WbsDialog';
import { ListOfBaseTables } from './Components';
import type { UploadPlan } from './uploadPlanParser';
import type { Dataset } from './Wrapped';

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
          buttons={commonText.close()}
          header={wbPlanText.noUploadPlan()}
          onClose={handleValid}
        >
          {wbPlanText.invalidTemplatePlan()}
        </Dialog>
      )}
      <DataSetsDialog
        showTemplates
        onClose={handleClose}
        onDataSetSelect={(id: number): void =>
          loading(
            ajax<Dataset>(`/api/workbench/dataset/${id}/`, {
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
  const [showHiddenTables = true, setShowHiddenTables] = useCachedState(
    'wbPlanViewUi',
    'showHiddenTables'
  );

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
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Blue onClick={handleUseTemplate}>
            {wbPlanText.chooseExistingPlan()}
          </Button.Blue>
        </>
      }
      className={{
        container: `${dialogClassNames.narrowContainer} h-1/2`,
      }}
      header={wbPlanText.selectBaseTable()}
      onClose={handleClose}
    >
      <ListOfBaseTables
        showHiddenTables={showHiddenTables}
        onChange={handleSelected}
      />
      <Label.Inline>
        <Input.Checkbox
          checked={showHiddenTables}
          onChange={(): void => setShowHiddenTables(!showHiddenTables)}
        />
        {wbPlanText.showAdvancedTables()}
      </Label.Inline>
    </Dialog>
  );
}
