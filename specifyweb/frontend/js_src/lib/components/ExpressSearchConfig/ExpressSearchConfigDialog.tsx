import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { expressSearchConfigText } from '../../localization/expressSearchConfig';
import { ajax } from '../../utils/ajax';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { ExpressSearchConfigEditor } from './ExpressSearchConfigEditor';

type ExpressSearchConfigDialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave?: () => void;
}

export function ExpressSearchConfigDialog({
  isOpen,
  onClose,
  onSave,
}: ExpressSearchConfigDialogProps) {
  const loading = React.useContext(LoadingContext);
  const [activeConfig, setActiveConfig] = React.useState<any>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const hasLoadedConfig = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      setActiveConfig(null);
      setIsDirty(false);
      hasLoadedConfig.current = false;
    }
  }, [isOpen]);

  const handleSave = React.useCallback(() => {
    if (!activeConfig) return;
    loading(
      ajax('/express_search/config/', {
        method: 'PUT',
        headers: {},
        body: activeConfig,
      }).then(() => {
        setIsDirty(false);
        onClose();
        onSave?.();
      })
    );
  }, [activeConfig, loading, onClose, onSave]);

  const handleChangeJSON = React.useCallback((next: any) => {
    setActiveConfig(next);
    if (hasLoadedConfig.current) setIsDirty(true);
    else hasLoadedConfig.current = true;
  }, []);

  const cancelLabel = (commonText.cancel as unknown as () => LocalizedString)();
  const saveLabel = (commonText.save as unknown as () => LocalizedString)();

  const buttons = (
    <div className="flex gap-2">
      <Button.DialogClose>{cancelLabel}</Button.DialogClose>
      <Button.Success disabled={!isDirty || !activeConfig} onClick={handleSave}>
        {saveLabel}
      </Button.Success>
    </div>
  );

  return (
    <Dialog
      buttons={buttons}
      className={{ container: dialogClassNames.wideContainer }}
      header={expressSearchConfigText.expressSearchConfigTitle()}
      icon={icons.cog}
      isOpen={isOpen}
      onClose={onClose}
    >
        <ExpressSearchConfigEditor
        key={String(isOpen)}
        onChangeJSON={handleChangeJSON}
      />
    </Dialog>
  );
}
