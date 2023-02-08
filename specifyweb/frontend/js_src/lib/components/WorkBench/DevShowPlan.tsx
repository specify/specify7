import React from 'react';

import { commonText } from '../../localization/common';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import { wbPlanText } from '../../localization/wbPlan';

/**
 * Show upload plan as JSON. Available in Development only
 */
export function DevShowPlan({
  dataSetId,
  uploadPlan: rawPlan,
  onClose: handleClose,
  onChanged: handleChanged,
  onDeleted: handleDeleted,
}: {
  readonly dataSetId: number;
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
          <Button.Green
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
          </Button.Green>
        </>
      }
      header={wbPlanText.dataMapper()}
      onClose={handleClose}
    >
      <AutoGrowTextArea value={uploadPlan} onValueChange={setUploadPlane} />
    </Dialog>
  );
}
