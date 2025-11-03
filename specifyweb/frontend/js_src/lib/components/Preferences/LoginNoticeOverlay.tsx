import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import {
  LoginNoticeForm,
  useLoginNoticeEditor,
} from './LoginNoticePreference';

export function LoginNoticeOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const loading = React.useContext(LoadingContext);
  const {
    state,
    isLoading,
    isSaving,
    error,
    hasChanges,
    setContent,
    setEnabled,
    save,
  } = useLoginNoticeEditor();
  const [hasSaved, markSaved, resetSaved] = useBooleanState();

  const handleSave = React.useCallback(() => {
    resetSaved();
    loading(
      save()
        .then(() => markSaved())
        .catch((error) => {
          throw error;
        })
    );
  }, [loading, markSaved, resetSaved, save]);

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Save
            disabled={!hasChanges || isSaving}
            onClick={handleSave}
          >
            {commonText.save()}
          </Button.Save>
        </>
      }
      header={preferencesText.loginPageNotice()}
      icon={icons.informationCircle}
      onClose={handleClose}
    >
      <LoginNoticeForm
      description={preferencesText.loginPageNoticeDescription()}
      error={error}
      isLoading={isLoading}
      isSaving={isSaving}
      state={state}
      successMessage={
        hasSaved ? preferencesText.loginPageNoticeSaved() : undefined
      }
        onContentChange={(value) => {
          resetSaved();
          setContent(value);
        }}
        onEnabledChange={(value) => {
          resetSaved();
          setEnabled(value);
        }}
      />
    </Dialog>
  );
}
