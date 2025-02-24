import React from 'react';

import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import type { WbMapping } from '../WorkBench/mapping';

export function WbNoUploadPlan({
  isUploaded,
  mappings,
  datasetId,
  noUploadPlan,
  onOpenNoUploadPlan: handleOpenNoUploadPlan,
  onCloseNoUploadPlan: handleCloseNoUploadPlan,
}: {
  readonly isUploaded: boolean;
  readonly mappings: WbMapping | undefined;
  readonly datasetId: number;
  readonly noUploadPlan: boolean;
  readonly onOpenNoUploadPlan: () => void;
  readonly onCloseNoUploadPlan: () => void;
}): JSX.Element {
  React.useEffect(() => {
    if (
      !isUploaded &&
      (mappings?.lines ?? []).length === 0 &&
      hasPermission('/workbench/dataset', 'upload')
    ) {
      handleOpenNoUploadPlan();
    }
  }, []);

  return (
    <>
      {noUploadPlan && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              <Link.Info href={`/specify/workbench/plan/${datasetId}/`}>
                {commonText.create()}
              </Link.Info>
            </>
          }
          header={wbPlanText.noUploadPlan()}
          onClose={handleCloseNoUploadPlan}
        >
          {wbPlanText.noUploadPlanDescription()}
        </Dialog>
      )}
    </>
  );
}
