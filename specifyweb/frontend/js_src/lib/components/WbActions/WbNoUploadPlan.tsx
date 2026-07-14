import React from 'react';

import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { TemplateSelection } from '../WbPlanView/State';
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
  const loading = React.useContext(LoadingContext);
  const [isChoosingPlan, setChoosingPlan] = React.useState(false);

  React.useEffect(() => {
    if (
      !isUploaded &&
      (mappings?.lines ?? []).length === 0 &&
      // TODO: Not sure about this, since this path will never logically happen for batch-edit
      hasPermission('/workbench/dataset', 'upload')
    ) {
      handleOpenNoUploadPlan();
    }
  }, []);

  return (
    <>
      {noUploadPlan && !isChoosingPlan && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              <Button.Info onClick={(): void => setChoosingPlan(true)}>
                {wbPlanText.chooseExistingPlan()}
              </Button.Info>
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
      {isChoosingPlan && (
        <TemplateSelection
          headers={[]}
          onClose={(): void => setChoosingPlan(false)}
          onSelect={(uploadPlan): void => {
            loading(
              ping(`/api/workbench/dataset/${datasetId}/`, {
                method: 'PUT',
                body: { uploadplan: uploadPlan },
              }).then(() => {
                window.location.href = `/specify/workbench/plan/${datasetId}/`;
              })
            );
          }}
        />
      )}
    </>
  );
}
