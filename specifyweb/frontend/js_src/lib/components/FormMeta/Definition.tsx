import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { resourcesText } from '../../localization/resources';
import { toggleItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { ViewDescription } from '../FormParse';
import { Dialog } from '../Molecules/Dialog';
import { ProtectedTool } from '../Permissions/PermissionDenied';
import { userPreferences } from '../Preferences/userPreferences';
import { UnloadProtectDialog } from '../Router/UnloadProtect';
import { unsetUnloadProtect } from '../../hooks/navigation';
import { useUnloadProtect } from '../../hooks/navigation';
import { saveFormUnloadProtect } from '../Forms/Save';
import { UnloadProtectsContext, SetUnloadProtectsContext } from '../Router/UnloadProtect';

export function Definition({
  table,
  viewDescription,
}: {
  readonly table: SpecifyTable;
  readonly viewDescription: ViewDescription | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small onClick={handleOpen}>
        {resourcesText.formDefinition()}
      </Button.Small>
      {isOpen && (
        <FormDefinitionDialog
          table={table}
          viewDescription={viewDescription}
          onClose={handleClose}
        />
      )}
    </>
  );
}


function FormDefinitionDialog({
  table,
  viewDescription,
  onClose: handleClose,
}: {
  readonly table: SpecifyTable;
  readonly viewDescription: ViewDescription | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [showUnloadProtect, setShowUnloadProtect] = React.useState(false);
  
  const [useFieldLabels = true, setUseFieldLabels] = useCachedState(
    'forms',
    'useFieldLabels'
  );

  const initialValue = React.useRef(useFieldLabels);
  const isChanged = React.useRef(false);
  React.useEffect(() => {
    isChanged.current = useFieldLabels !== initialValue.current;
  }, [useFieldLabels]);

  // const unsetUnloadProtect = useUnloadProtect(
  //   isChanged.current,
  //   saveFormUnloadProtect
  // );
  // Show a warning dialog if navigating away before saving the record
  const [unloadProtect, setUnloadProtect] = React.useState<
    (() => void) | undefined
  >(undefined);
  const setUnloadProtects = React.useContext(SetUnloadProtectsContext)!;
  const unloadProtects = React.useContext(UnloadProtectsContext)!;

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose disabled={useFieldLabels !== initialValue.current && unloadProtects.length > 0}
          >{commonText.close()}</Button.DialogClose>
        </>}
      header={resourcesText.formDefinition()}
      onClose={(): void => {
        if (useFieldLabels !== initialValue.current && unloadProtects.length > 0) setUnloadProtect(() => () => {return true});
        else 
        handleClose();
      }}
      onClose={handleClose}
    >
      <UseAutoForm table={table} />
      <UseLabels />
      {typeof viewDescription?.viewSetId === 'number' && (
        <EditFormDefinition
          name={viewDescription.name}
          table={table}
          viewSetId={viewDescription.viewSetId}
        />
      )}
      {typeof unloadProtect === 'function' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Warning
                onClick={(): void => {
                  unsetUnloadProtect(setUnloadProtects, saveFormUnloadProtect);
                  setUnloadProtects([]);
                  unloadProtect();
                  setUnloadProtect(undefined);
                  globalThis.location.reload();
                }}
              >
                {commonText.proceed()}
              </Button.Warning>
            </>
          }
          header={formsText.unsavedFormUnloadProtect()}
          onClose={(): void => setUnloadProtect(undefined)}
        >
          {formsText.unsavedFormUnloadProtect()}
        </Dialog>
      )}
      {/* {typeof unloadProtect === 'function' && (
        <UnloadProtectDialog
          onCancel={(): void => {}}
          onConfirm={(): void => globalThis.location.reload()}
        >
          {formsText.unsavedFormUnloadProtect()}
        </UnloadProtectDialog>
      )} */}
    </Dialog>
  );
}

function UseAutoForm({ table }: { readonly table: SpecifyTable }): JSX.Element {
  const [rawConfig, setGlobalConfig] = userPreferences.use(
    'form',
    'preferences',
    'useCustomForm'
  );
  // This used to be stored as an object
  const globalConfig = Array.isArray(rawConfig) ? rawConfig : [];
  const useCustomForm = globalConfig.includes(table.name);
  return (
    <Label.Inline>
      <Input.Checkbox
        checked={useCustomForm}
        onValueChange={(): void =>
          setGlobalConfig(toggleItem(globalConfig, table.name))
        }
      />
      {formsText.useAutoGeneratedForm()}
    </Label.Inline>
  );
}

function UseLabels(): JSX.Element {
  const [useFieldLabels = true, setUseFieldLabels] = useCachedState(
    'forms',
    'useFieldLabels'
  );

  const initialValue = React.useRef(useFieldLabels);
  const isChanged = React.useRef(false);
  React.useEffect(() => {
    isChanged.current = useFieldLabels !== initialValue.current;
  }, [useFieldLabels]);

  React.useEffect(
    () => () => {
      if (isChanged.current) {
        globalThis.location.reload();
      }
    },
    []
  );

  return (
    <Label.Inline>
      <Input.Checkbox
        checked={useFieldLabels}
        onValueChange={setUseFieldLabels}
      />
      {formsText.useFieldLabels()}
    </Label.Inline>
  );
}

function EditFormDefinition({
  viewSetId,
  table,
  name,
}: {
  readonly viewSetId: number;
  readonly table: SpecifyTable;
  readonly name: string;
}): JSX.Element {
  return (
    <ProtectedTool action="read" tool="resources">
      <Link.NewTab
        href={`/specify/resources/view-set/${viewSetId}/${table.name}/${name}`}
      >
        {formsText.editFormDefinition()}
      </Link.NewTab>
    </ProtectedTool>
  );
}
