import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { UiPlugins } from '../parseuiplugins';
import { Button } from './basic';
import { Dialog } from './modaldialog';

const pluginRenderers: {
  readonly [KEY in keyof UiPlugins]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly label: string | undefined;
    readonly pluginDefinition: UiPlugins[KEY];
  }) => JSX.Element;
} = {
  Unsupported({ pluginDefinition: { name }, id }) {
    const [isClicked, setIsClicked] = React.useState(false);
    return (
      <>
        <Button.Simple id={id} onClick={(): void => setIsClicked(true)}>
          {formsText('unavailablePluginButton')}
        </Button.Simple>
        <Dialog
          isOpen={isClicked}
          onClose={(): void => setIsClicked(false)}
          title={formsText('unavailablePluginDialogTitle')}
          header={formsText('unavailablePluginDialogHeader')}
          buttons={commonText('close')}
        >
          {formsText('unavailablePluginDialogMessage')}
          <br />
          {`${formsText('pluginName')} ${name ?? commonText('nullInline')}`}
        </Dialog>
      </>
    );
  },
};

export function UiCommand({
  resource,
  id,
  label,
  pluginDefinition,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly id: string | undefined;
  readonly label: string | undefined;
  readonly pluginDefinition: UiPlugins[keyof UiPlugins];
}): JSX.Element {
  return pluginRenderers[pluginDefinition.type]({
    resource,
    id,
    label,
    pluginDefinition,
  });
}
