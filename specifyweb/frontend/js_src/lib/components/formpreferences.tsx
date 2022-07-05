import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { Button, H3 } from './basic';
import { FormAutoNumbering } from './formautonumbering';
import { CarryForwardButton } from './formcarryforward';
import { FormDefinition } from './formdefinition';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog } from './modaldialog';
import { ProtectedAction, ProtectedTool } from './permissiondenied';
import { RecordHistory } from './recordhistory';
import { ShareRecord } from './sharerecord';

export function FormPreferences({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  return typeof resource === 'object' ? (
    <>
      <Button.Small
        title={commonText('preferences')}
        aria-label={commonText('preferences')}
        onClick={handleToggle}
      >
        {icons.cog}
      </Button.Small>
      {isOpen && typeof resource === 'object' ? (
        <PreferencesDialog resource={resource} onClose={handleClose} />
      ) : undefined}
    </>
  ) : null;
}

function PreferencesDialog({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={resource.specifyModel.label}
      onClose={handleClose}
      buttons={commonText('close')}
      modal={false}
    >
      <div className="flex flex-col gap-2 pb-2">
        <H3>{formsText('formConfiguration')}</H3>
        <div className="flex flex-wrap gap-2">
          <CarryForwardButton model={resource.specifyModel} />
          <FormAutoNumbering resource={resource} />
          <FormDefinition model={resource.specifyModel} />
        </div>
      </div>
      <div className="flex flex-col gap-2 pb-2">
        <ProtectedTool tool="auditLog" action="read">
          <ProtectedAction resource="/querybuilder/query" action="execute">
            <H3>{formsText('recordInformation')}</H3>
            <div className="flex flex-wrap gap-2">
              <RecordHistory resource={resource} />
            </div>
            {!resource.isNew() && <ShareRecord resource={resource} />}
          </ProtectedAction>
        </ProtectedTool>
      </div>
    </Dialog>
  );
}
