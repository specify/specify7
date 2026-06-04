/**
 * Show upload plan as JSON
 */

import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile, fileToText } from '../Molecules/FilePicker';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import type { Dataset } from '../WbPlanView/Wrapped';
import { dialogIcons, icons } from '../Atoms/Icons';

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
        {wbPlanText.importExportMapping()}
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
  const [invalidJson, showInvalid, closeInvalid] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    const file = event.target.files?.[0];
    if (file === undefined) return;
    loading(
      fileToText(file)
        .then((text) => {
          JSON.parse(text);
          setUploadPlane(text);
        })
        .catch(showInvalid)
    );
    event.target.value = '';
  }

  return (
    <>
      {invalidJson && (
        <Dialog
          icon={dialogIcons.warning}
          buttons={commonText.close()}
          header={wbPlanText.invalidJsonFile()}
          onClose={closeInvalid}
        >
          {wbPlanText.invalidJsonFileDescription()}
        </Dialog>
      )}
      <Dialog
        icon={icons.clipboard}
        buttons={
          <>
            <input
              accept=".json"
              className="sr-only"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
            />
            <Button.Info
              onClick={(): void => fileInputRef.current?.click()}
            >
              {commonText.import()}
            </Button.Info>
            <Button.Info
              onClick={(): void => void downloadFile(`${name}.json`, uploadPlan)}
            >
              {commonText.export()}
            </Button.Info>
            <span className="-ml-4 flex-1" />
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
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
        header={wbPlanText.importExportMapping()}
        onClose={handleClose}
      >
        <p className="text-wrap mb-4">
          {wbPlanText.importExportMappingDescription()}
        </p>
        <AutoGrowTextArea value={uploadPlan} onValueChange={setUploadPlane} />
      </Dialog>
    </>
  );
}
