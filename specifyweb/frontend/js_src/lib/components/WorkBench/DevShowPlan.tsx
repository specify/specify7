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

/**
 * Show upload plan as JSON. Available in Development only
 */
export function DevShowPlan({
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
