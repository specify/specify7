import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { toTable } from '../specifymodel';
import { isTreeResource } from '../treedefinitions';
import { Button, H3 } from './basic';
import { FormAutoNumbering } from './formautonumbering';
import { CarryForwardButton } from './formcarryforward';
import { FormDefinition } from './formdefinition';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog } from './modaldialog';
import { ProtectedAction, ProtectedTool } from './permissiondenied';
import { PickListUsages } from './picklistusages';
import { QueryTreeUsages } from './querytreeusages';
import { RecordHistory } from './recordhistory';
import { ShareRecord } from './sharerecord';
import { PrintOnSave } from './specifyformcheckbox';
import { SubViewContext } from './subview';
import { SubViewPreferences } from './subviewpreferences';
import { useCachedState } from './statecache';
import { ReadOnlyMode } from './readonlymode';

export function FormPreferences({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  const [isReadOnly = false] = useCachedState({
    category: 'forms',
    key: 'readOnlyMode',
    defaultValue: false,
    staleWhileRefresh: false,
  });
  return typeof resource === 'object' ? (
    <>
      <Button.Small
        title={commonText('preferences')}
        aria-label={commonText('preferences')}
        onClick={handleToggle}
      >
        {icons.cog}
        {isReadOnly && commonText('readOnly')}
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
  const subView = React.useContext(SubViewContext);
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
          <ReadOnlyMode isNew={resource.isNew()} />
        </div>
        <PrintOnSave
          model={resource.specifyModel}
          id={undefined}
          fieldName={undefined}
          text={formsText('printOnSave')}
          defaultValue={false}
        />
      </div>
      {typeof subView === 'object' ? (
        <div className="flex flex-col gap-2 pb-2">
          <H3>{formsText('recordSelectorConfiguration')}</H3>
          <SubViewPreferences subView={subView} model={resource.specifyModel} />
        </div>
      ) : undefined}
      <div className="flex flex-col gap-2 pb-2">
        <H3>{formsText('recordInformation')}</H3>
        <div className="flex flex-wrap gap-2">
          <ProtectedTool tool="auditLog" action="read">
            <ProtectedAction resource="/querybuilder/query" action="execute">
              <RecordHistory resource={resource} />
            </ProtectedAction>
          </ProtectedTool>
          {isTreeResource(resource) && <QueryTreeUsages resource={resource} />}
          <ProtectedTool tool="pickLists" action="read">
            <ProtectedAction resource="/querybuilder/query" action="execute">
              {f.maybe(toTable(resource, 'PickList'), (pickList) => (
                <PickListUsages pickList={pickList} />
              ))}
            </ProtectedAction>
          </ProtectedTool>
        </div>
        {!resource.isNew() && <ShareRecord resource={resource} />}
      </div>
    </Dialog>
  );
}
