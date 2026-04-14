import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { ExpressSearchConfigEditor } from './ExpressSearchConfigEditor';
import { ajax } from '../../utils/ajax';
import { LoadingContext } from '../Core/Contexts';
import { icons } from '../Atoms/Icons';
import { expressSearchConfigText } from '../../localization/expressSearchConfig';
import { commonText } from '../../localization/common';

interface ExpressSearchConfigDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function ExpressSearchConfigDialog({
  isOpen,
  onClose,
}: ExpressSearchConfigDialogProps) {
  const loading = React.useContext(LoadingContext);
  const [activeConfig, setActiveConfig] = React.useState<any>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const hasLoadedConfig = React.useRef(false);

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
      })
    );
  }, [activeConfig, loading, onClose]);

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
      <Button.Success onClick={handleSave} disabled={!isDirty || !activeConfig}>
        {saveLabel}
      </Button.Success>
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      header={expressSearchConfigText.expressSearchConfig()}
      onClose={onClose}
      buttons={buttons}
      icon={icons.cog}
      className={{ container: dialogClassNames.wideContainer }}
    >
      <ExpressSearchConfigEditor
        onChangeJSON={handleChangeJSON}
      />
    </Dialog>
  );
}
