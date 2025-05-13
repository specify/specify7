/**
 * Show upload plan as JSON
 */

import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import type { Dataset } from '../WbPlanView/Wrapped';

export function WbRawPlan({
  dataset,
  onDatasetDeleted: handleDatasetDeleted,
  triggerDatasetRefresh,
}: {
  readonly dataset: Dataset;
  readonly onDatasetDeleted: () => void;
  readonly triggerDatasetRefresh: () => void;
}): JSX.Element {
  const [showRawPlan, openRawPlan, closeRawPlan] = useBooleanState();
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={showRawPlan}
        onClick={openRawPlan}
      >
        {wbText.uploadPlan()}
      </Button.Small>
      {showRawPlan && (
        <RawUploadPlan
          datasetId={dataset.id}
          datasetName={dataset.name}
          isUploaded={
            dataset.uploadresult !== null && dataset.uploadresult.success
          }
          uploadPlan={dataset.uploadplan ?? ({} as UploadPlan)}
          onChanged={(plan) => {
            overwriteReadOnly(dataset, 'uploadplan', plan);
            triggerDatasetRefresh();
          }}
          onClose={closeRawPlan}
          onDeleted={handleDatasetDeleted}
        />
      )}
    </>
  );
}

function RawUploadPlan({
  datasetId,
  datasetName: name,
  uploadPlan: rawPlan,
  isUploaded,
  onClose: handleClose,
  onChanged: handleChanged,
  onDeleted: handleDeleted,
}: {
  readonly datasetId: number;
  readonly datasetName: string;
  readonly uploadPlan: UploadPlan;
  readonly isUploaded: boolean;
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
            disabled={
              JSON.stringify(rawPlan, null, 4) === uploadPlan || isUploaded
            }
            onClick={(): void => {
              const plan =
                uploadPlan.length === 0 ? null : JSON.parse(uploadPlan);
              loading(
                ping(`/api/workbench/dataset/${datasetId}/`, {
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
