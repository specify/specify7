import React from 'react';

import type { Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { FormMode, FormType } from '../parseform';
import type { UiPlugins } from '../parseuiplugins';
import { isResourceOfType } from '../specifymodel';
import { AttachmentPlugin } from './attachmentplugin';
import { Button } from './basic';
import { CollectionOneToManyPlugin } from './collectionrelonetomanyplugin';
import { CollectionOneToOnePlugin } from './collectionrelonetooneplugin';
import { GeoLocatePlugin } from './geolocateplugin';
import { useBooleanState } from './hooks';
import { HostTaxonPlugin } from './hosttaxonplugin';
import { LatLongUi } from './latlongui';
import { Dialog } from './modaldialog';
import { PartialDateUi } from './partialdateui';
import { PasswordPlugin } from './passwordplugin';
import { UserCollectionsPlugin } from './usercollectionsplugin';
import { WebLinkButton } from './weblinkbutton';

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
    readonly id: string | undefined;
    readonly isReadOnly: boolean;
    readonly pluginDefinition: UiPlugins[KEY];
    readonly fieldName: string;
    readonly formType: FormType;
    readonly mode: FormMode;
  }) => JSX.Element;
} = {
  UserCollectionsUI({ resource }) {
    return isResourceOfType(resource, 'SpecifyUser') ? (
      <UserCollectionsPlugin resource={resource} />
    ) : (
      <WrongTable resource={resource} allowedTable="SpecifyUser" />
    );
  },
  LatLonUI: LatLongUi,
  PartialDateUI: ({
    id,
    resource,
    isReadOnly,
    pluginDefinition: {
      defaultValue,
      dateField,
      defaultPrecision,
      precisionField,
    },
  }) => {
    if (typeof dateField === 'undefined') {
      console.error(
        "Can't display PartialDateUi because initialize.df is not set"
      );
      return <></>;
    }
    return (
      <PartialDateUi
        resource={resource}
        id={id}
        isReadOnly={isReadOnly}
        defaultValue={defaultValue}
        defaultPrecision={defaultPrecision}
        precisionField={precisionField}
        dateField={dateField}
      />
    );
  },
  CollectionRelOneToManyPlugin({
    resource,
    pluginDefinition: { relationship },
  }) {
    if (typeof relationship === 'undefined') {
      console.error(
        "Can't display CollectionRelOneToManyPlugin because initialize.relname is not set"
      );
      return <></>;
    }
    return isResourceOfType(resource, 'CollectionObject') ? (
      resource.isNew() ? (
        <></>
      ) : (
        <CollectionOneToManyPlugin
          resource={resource}
          relationship={relationship}
        />
      )
    ) : (
      <WrongTable resource={resource} allowedTable="CollectionObject" />
    );
  },
  ColRelTypePlugin({ resource, pluginDefinition: { relationship } }) {
    if (typeof relationship === 'undefined') {
      console.error(
        "Can't display CollectionRelOneToManyPlugin because initialize.relname is not set"
      );
      return <></>;
    }
    return isResourceOfType(resource, 'CollectionObject') ? (
      resource.isNew() ? (
        <></>
      ) : (
        <CollectionOneToOnePlugin
          resource={resource}
          relationship={relationship}
        />
      )
    ) : (
      <WrongTable resource={resource} allowedTable="CollectionObject" />
    );
  },
  LocalityGeoRef({ resource }) {
    return isResourceOfType(resource, 'Locality') ? (
      <GeoLocatePlugin resource={resource} />
    ) : (
      <WrongTable resource={resource} allowedTable="Locality" />
    );
  },
  WebLinkButton({
    resource,
    fieldName,
    pluginDefinition: { webLink, icon },
    formType,
    mode,
    id,
  }) {
    return (
      <WebLinkButton
        resource={resource}
        fieldName={fieldName}
        webLink={webLink}
        icon={icon}
        formType={formType}
        mode={mode}
        id={id}
      />
    );
  },
  AttachmentPlugin({ resource, mode, id, fieldName }) {
    return (
      <AttachmentPlugin
        resource={resource}
        mode={mode}
        id={id}
        name={fieldName}
      />
    );
  },
  HostTaxonPlugin({ resource, pluginDefinition: { relationship } }) {
    if (typeof relationship === 'undefined') {
      console.error(
        "Can't display CollectionRelOneToManyPlugin because initialize.relname is not set"
      );
      return <></>;
    } else
      return (
        <HostTaxonPlugin resource={resource} relationship={relationship} />
      );
  },
  PasswordUI({ resource }) {
    return isResourceOfType(resource, 'SpecifyUser') ? (
      <PasswordPlugin user={resource} />
    ) : (
      <WrongTable resource={resource} allowedTable="SpecifyUser" />
    );
  },
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
  id,
  resource,
  mode,
  pluginDefinition,
  fieldName,
  formType,
}: {
  readonly id: string;
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly pluginDefinition: UiPlugins[keyof UiPlugins];
  readonly fieldName: string | undefined;
  readonly formType: FormType;
}): JSX.Element {
  return pluginRenderers[pluginDefinition.type]({
    id,
    resource,
    isReadOnly: mode === 'view',
    pluginDefinition,
    defaultValue,
    fieldName,
    formType,
    mode,
  });
}
