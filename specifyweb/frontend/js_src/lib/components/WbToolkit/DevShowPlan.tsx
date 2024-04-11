import React from 'react';

import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import { overwriteReadOnly } from '../../utils/types';
import type { Dataset } from '../WbPlanView/Wrapped';
import { useBooleanState } from '../../hooks/useBooleanState';
import { wbText } from '../../localization/workbench';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

export function WbDevPlan({
  dataset,
  handleDatasetDelete,
  triggerDatasetRefresh,
}: {
  readonly dataset: Dataset;
  readonly handleDatasetDelete: () => void;
  readonly triggerDatasetRefresh: () => void;
}): JSX.Element {
  const [showDevPlan, openDevPlan, closeDevPlan] = useBooleanState();
  return (
    <>
      <ErrorBoundary dismissible>
        <Button.Small
          aria-haspopup="dialog"
          aria-pressed={showDevPlan}
          onClick={openDevPlan}
        >
          {wbText.uploadPlan()}
        </Button.Small>
        {showDevPlan && (
          <DevShowPlan
            dataSetId={dataset.id}
            dataSetName={dataset.name}
            uploadPlan={dataset.uploadplan ?? ({} as UploadPlan)}
            onChanged={(plan) => {
              overwriteReadOnly(dataset, 'uploadplan', plan);
              triggerDatasetRefresh();
            }}
            onClose={closeDevPlan}
            onDeleted={handleDatasetDelete}
          />
        )}
      </ErrorBoundary>
    </>
  );
}

/**
 * Show upload plan as JSON
 */
function DevShowPlan({
  dataSetId,
  dataSetName: name,
  uploadPlan: rawPlan,
  onClose: handleClose,
  onChanged: handleChanged,
  onDeleted: handleDeleted,
}: {
  readonly dataSetId: number;
  readonly dataSetName: string;
  readonly uploadPlan: UploadPlan;
  readonly onClose: () => void;
  readonly onChanged: (plan: UploadPlan) => void;
  readonly onDeleted: () => void;
}): JSX.Element {
  const [uploadPlan, setUploadPlane] = React.useState<string>(() =>
    JSON.stringify(rawPlan, null, 4)
  );
  const loading = React.useContext(LoadingContext);
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info
            onClick={(): void => void downloadFile(`${name}.json`, uploadPlan)}
          >
            {commonText.export()}
          </Button.Info>
          <span className="-ml-4 flex-1" />
          <Button.Save
            onClick={(): void => {
              const plan =
                uploadPlan.length === 0 ? null : JSON.parse(uploadPlan);
              loading(
                ping(`/api/workbench/dataset/${dataSetId}/`, {
                  method: 'PUT',
                  body: { uploadplan: plan },
                  expectedErrors: [Http.NOT_FOUND],
                })
                  .then((status) =>
                    status === Http.NOT_FOUND
                      ? handleDeleted()
                      : handleChanged(plan)
                  )
                  .finally(handleClose)
              );
            }}
          >
            {commonText.save()}
          </Button.Save>
        </>
      }
      header={wbPlanText.dataMapper()}
      onClose={handleClose}
    >
      <AutoGrowTextArea value={uploadPlan} onValueChange={setUploadPlane} />
    </Dialog>
  );
}
