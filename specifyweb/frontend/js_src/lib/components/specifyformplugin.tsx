import React from 'react';

import type { Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { UiPlugins } from '../parseuiplugins';
import { isResourceOfType } from '../specifymodel';
import { Button } from './basic';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { UserCollectionsPlugin } from './usercollectionsplugin';

function WrongTable({
  resource,
  allowedTable,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly allowedTable: keyof Tables;
}): JSX.Element {
  const [isVisible, handleShow, handleHide] = useBooleanState();
  return (
    <>
      <Button.Simple onClick={handleShow}>
        {formsText('unavailablePluginButton')}
      </Button.Simple>
      <Dialog
        isOpen={isVisible}
        onClose={handleHide}
        title={formsText('pluginName')}
        header={formsText('unavailablePluginDialogHeader')}
        buttons={commonText('close')}
      >
        {formsText('wrongTablePluginDialogMessage')(
          resource.specifyModel.name,
          allowedTable
        )}
      </Dialog>
    </>
  );
}

const pluginRenderers: {
  readonly [KEY in keyof UiPlugins]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly isReadOnly: boolean;
    readonly pluginDefinition: UiPlugins[KEY];
  }) => JSX.Element;
} = {
  UserCollectionsUI({ resource }) {
    return isResourceOfType(resource, 'SpecifyUser') ? (
      <UserCollectionsPlugin resource={resource} />
    ) : (
      <WrongTable resource={resource} allowedTable="SpecifyUser" />
    );
  },
  LatLonUI: () => ({ type: 'LatLonUI' }),
  PartialDateUI: ({ properties }) => ({
    type: 'PartialDateUI',
    dateField: properties.df.toLowerCase(),
    datePrecisionField: properties.tp.toLowerCase(),
    defaultPrecision: ['year', 'month-year'].includes(
      properties.defaultprecision.toLowerCase()
    )
      ? (properties.defaultprecision.toLowerCase() as 'year' | 'month-year')
      : 'full',
  }),
  CollectionRelOneToManyPlugin: ({ properties }) => ({
    type: 'CollectionRelOneToManyPlugin',
    relationship: properties.relname,
  }),
  ColRelTypePlugin: () => ({ type: 'ColRelTypePlugin' }),
  LocalityGeoRef: () => ({ type: 'LocalityGeoRef' }),
  WebLinkButton: ({ properties }) => ({
    type: 'WebLinkButton',
    webLink: properties.weblink,
    icon: properties.icon ?? 'WebLink',
  }),
  AttachmentPlugin: () => ({ type: 'AttachmentPlugin' }),
  HostTaxonPlugin: ({ properties }) => ({
    type: 'HostTaxonPlugin',
    relationship: properties.relname,
  }),
  PasswordUI: () => ({ type: 'PasswordUI' }),
  UserAgentsUI: () => ({ type: 'UserAgentsUI' }),
  AdminStatusUI: () => ({ type: 'AdminStatusUI' }),
  LocalityGoogleEarth: () => ({ type: 'LocalityGoogleEarth' }),
  PaleoMap: () => ({ type: 'PaleoMap' }),
  Unsupported({ pluginDefinition: { name }, id }) {
    const [isVisible, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Simple id={id} onClick={handleShow}>
          {formsText('unavailablePluginButton')}
        </Button.Simple>
        <Dialog
          isOpen={isVisible}
          onClose={handleHide}
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

export function UiPlugin({
  resource,
  isReadOnly,
  pluginDefinition,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly isReadOnly: boolean;
  readonly pluginDefinition: UiPlugins[keyof UiPlugins];
}): JSX.Element {
  return pluginRenderers[pluginDefinition.type]({
    resource,
    isReadOnly,
    pluginDefinition,
  });
}
