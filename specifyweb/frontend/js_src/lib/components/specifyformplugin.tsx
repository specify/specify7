import React from 'react';

import type { Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode, FormType } from '../parseform';
import type { FieldTypes } from '../parseformfields';
import type { UiPlugins } from '../parseuiplugins';
import { hasTablePermission } from '../permissions';
import { toTable } from '../specifymodel';
import { AttachmentPlugin } from './attachmentplugin';
import { Button } from './basic';
import { CollectionOneToManyPlugin } from './collectionrelonetomanyplugin';
import { CollectionOneToOnePlugin } from './collectionrelonetooneplugin';
import { GeoLocatePlugin } from './geolocateplugin';
import { useBooleanState } from './hooks';
import { HostTaxonPlugin } from './hosttaxonplugin';
import { LatLongUi } from './latlongui';
import { LeafletPlugin } from './leafletplugin';
import { Dialog } from './modaldialog';
import { PaleoLocationMapPlugin } from './paleolocationplugin';
import { PartialDateUi } from './partialdateui';
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
      <Button.Small onClick={handleShow}>
        {formsText('unavailablePluginButton')}
      </Button.Small>
      <Dialog
        isOpen={isVisible}
        onClose={handleHide}
        title={formsText('pluginName')}
        header={formsText('unavailablePluginDialogHeader')}
        buttons={commonText('close')}
      >
        {formsText('wrongTablePluginDialogText')(
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
    readonly pluginDefinition: UiPlugins[KEY];
    readonly fieldName: string | undefined;
    readonly formType: FormType;
    readonly mode: FormMode;
    readonly isRequired: boolean;
  }) => JSX.Element | null;
} = {
  LatLonUI({ resource, mode, id, pluginDefinition: { step } }) {
    return (
      f.maybe(toTable(resource, 'Locality'), (locality) => (
        <LatLongUi resource={locality} mode={mode} id={id} step={step} />
      )) ?? <WrongTable resource={resource} allowedTable="Locality" />
    );
  },
  PartialDateUI: ({
    id,
    resource,
    mode,
    fieldName,
    pluginDefinition: {
      defaultValue,
      dateField,
      defaultPrecision,
      precisionField,
    },
  }) => {
    const field = dateField ?? fieldName;
    if (typeof field === 'undefined') {
      console.error(
        "Can't display PartialDateUi because initialize.df is not set"
      );
      return null;
    } else
      return (
        <PartialDateUi
          resource={resource}
          id={id}
          isReadOnly={mode === 'view'}
          defaultValue={defaultValue}
          defaultPrecision={defaultPrecision}
          precisionField={precisionField}
          dateField={field}
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
      return null;
    } else
      return resource.isNew() ||
        !hasTablePermission('CollectionRelationship', 'read') ||
        !hasTablePermission('CollectionRelType', 'read')
        ? null
        : f.maybe(toTable(resource, 'CollectionObject'), (collectionObject) => (
            <CollectionOneToManyPlugin
              resource={collectionObject}
              relationship={relationship}
            />
          )) ?? (
            <WrongTable resource={resource} allowedTable="CollectionObject" />
          );
  },
  ColRelTypePlugin({ resource, pluginDefinition: { relationship } }) {
    if (typeof relationship === 'undefined') {
      console.error(
        "Can't display CollectionRelOneToManyPlugin because initialize.relname is not set"
      );
      return null;
    } else
      return resource.isNew() ||
        !hasTablePermission('CollectionRelationship', 'read') ||
        !hasTablePermission('CollectionRelType', 'read')
        ? null
        : f.maybe(toTable(resource, 'CollectionObject'), (collectionObject) => (
            <CollectionOneToOnePlugin
              resource={collectionObject}
              relationship={relationship}
            />
          )) ?? (
            <WrongTable resource={resource} allowedTable="CollectionObject" />
          );
  },
  LocalityGeoRef({ resource }) {
    return (
      f.maybe(toTable(resource, 'Locality'), (locality) => (
        <GeoLocatePlugin resource={locality} />
      )) ?? <WrongTable resource={resource} allowedTable="Locality" />
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
    return hasTablePermission('Attachment', 'read') ? (
      <AttachmentPlugin
        resource={resource}
        mode={mode}
        id={id}
        name={fieldName}
      />
    ) : (
      void console.error(
        "Can't display AttachmentPlugin. User has no read access to Attachment table"
      ) ?? null
    );
  },
  HostTaxonPlugin({
    resource,
    mode,
    id,
    formType,
    isRequired,
    pluginDefinition: { relationship },
  }) {
    if (typeof relationship === 'undefined') {
      console.error(
        "Can't display HostTaxonPlugin because initialize.relname is not set"
      );
      return null;
    } else
      return hasTablePermission('CollectionRelType', 'read') ? (
        <HostTaxonPlugin
          resource={resource}
          relationship={relationship}
          mode={mode}
          id={id}
          formType={formType}
          isRequired={isRequired}
        />
      ) : null;
  },
  LocalityGoogleEarth({ resource, id }) {
    return (
      f.maybe(toTable(resource, 'Locality'), (locality) => (
        <LeafletPlugin locality={locality} id={id} />
      )) ?? <WrongTable resource={resource} allowedTable="Locality" />
    );
  },
  PaleoMap: PaleoLocationMapPlugin,
  Unsupported({ pluginDefinition: { name }, id }) {
    const [isVisible, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Small id={id} onClick={handleShow} className="w-fit">
          {formsText('unavailablePluginButton')}
        </Button.Small>
        <Dialog
          isOpen={isVisible}
          onClose={handleHide}
          title={formsText('unavailablePluginDialogTitle')}
          header={formsText('unavailablePluginDialogHeader')}
          buttons={commonText('close')}
        >
          {formsText('unavailablePluginDialogText')}
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
  fieldDefinition,
  fieldName,
  formType,
  isRequired,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly fieldDefinition: FieldTypes['Plugin'];
  readonly fieldName: string | undefined;
  readonly formType: FormType;
  readonly isRequired: boolean;
}): JSX.Element {
  const Renderer = pluginRenderers[
    fieldDefinition.pluginDefinition.type
  ] as typeof pluginRenderers.AttachmentPlugin;
  return (
    <Renderer
      id={id}
      resource={resource}
      pluginDefinition={
        fieldDefinition.pluginDefinition as UiPlugins['AttachmentPlugin']
      }
      fieldName={fieldName}
      formType={formType}
      mode={mode}
      isRequired={isRequired}
    />
  );
}
