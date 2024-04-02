import React from "react";

import { useBooleanState } from "../../../hooks/useBooleanState";
import { Button } from "../../Atoms/Button";
import { wbText } from "../../../localization/workbench";
import { commonText } from "../../../localization/common";
import { Dialog } from "../../Molecules/Dialog";

export function WbRevert({
  hasUnSavedChanges,
  triggerRefresh,
  spreadSheetUpToDate,
}: {
  readonly hasUnSavedChanges: boolean;
  readonly triggerRefresh: () => void;
  readonly spreadSheetUpToDate: () => void;
}): JSX.Element {
  const [showRevert, openRevert, closeRevert] = useBooleanState();

  const handleRevert = () => {
    triggerRefresh();
    closeRevert();
    spreadSheetUpToDate();
  };

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-revert"
        onClick={openRevert}
        disabled={!hasUnSavedChanges}
      >
        {wbText.revert()}
      </Button.Small>
      {showRevert && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Danger onClick={handleRevert}>
                {wbText.revert()}
              </Button.Danger>
            </>
          }
          header={wbText.revertChanges()}
          onClose={closeRevert}
        >
          {wbText.revertChangesDescription()}
        </Dialog>
      )}
    </>
  );
}
