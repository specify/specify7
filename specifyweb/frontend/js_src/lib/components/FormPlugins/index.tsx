import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { formatList } from '../Atoms/Internationalization';
import { AttachmentsPlugin } from '../Attachments/Plugin';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Tables } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { FormMode, FormType } from '../FormParse';
import type { FieldTypes } from '../FormParse/fields';
import type { UiPlugins } from '../FormParse/plugins';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { CollectionOneToManyPlugin } from './CollectionRelOneToMany';
import { CollectionOneToOnePlugin } from './CollectionRelOneToOne';
import { GeoLocatePlugin } from './GeoLocate';
import { HostTaxon } from './HostTaxon';
import { LatLongUi } from './LatLongUi';
import { LeafletPlugin } from './Leaflet';
import { PaleoLocationMapPlugin } from './PaleoLocation';
import { PartialDateUi } from './PartialDateUi';
import { WebLink } from './WebLink';
import { LiteralField, Relationship } from '../DataModel/specifyField';

const pluginRenderers: {
  readonly [KEY in keyof UiPlugins]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly name: string | undefined;
    readonly pluginDefinition: UiPlugins[KEY];
    readonly field: LiteralField | Relationship | undefined;
    readonly formType: FormType;
    readonly mode: FormMode;
    readonly isRequired: boolean;
  }) => JSX.Element | null;
} = {
  LatLonUI({ resource, mode, id, pluginDefinition: { step, latLongType } }) {
    const locality = toTable(resource, 'Locality');
    return locality === undefined ? null : (
      <LatLongUi
        id={id}
        latLongType={latLongType}
        mode={mode}
        resource={locality}
        step={step}
      />
    );
  },
  PartialDateUI: ({
    id,
    resource,
    mode,
    formType,
    field,
    pluginDefinition: {
      defaultValue,
      defaultPrecision,
      precisionField,
      canChangePrecision,
    },
  }) =>
    field === undefined || field.isRelationship ? null : (
      <ErrorBoundary dismissable>
        <PartialDateUi
          canChangePrecision={canChangePrecision && formType === 'form'}
          dateField={field.name}
          defaultPrecision={defaultPrecision}
          defaultValue={defaultValue}
          id={id}
          isReadOnly={mode === 'view'}
          precisionField={precisionField}
          resource={resource}
        />
      </ErrorBoundary>
    ),
  CollectionRelOneToManyPlugin({
    resource,
    pluginDefinition: { relationship, formatting },
  }) {
    const collectionObject = toTable(resource, 'CollectionObject');
    return collectionObject === undefined ? null : (
      <ErrorBoundary dismissable>
        <CollectionOneToManyPlugin
          formatting={formatting}
          relationship={relationship}
          resource={collectionObject}
        />
      </ErrorBoundary>
    );
  },
  ColRelTypePlugin({
    resource,
    pluginDefinition: { relationship, formatting },
  }) {
    const collectionObject = toTable(resource, 'CollectionObject');
    return resource.isNew() || collectionObject === undefined ? null : (
      <ErrorBoundary dismissable>
        <CollectionOneToOnePlugin
          formatting={formatting}
          relationship={relationship}
          resource={collectionObject}
        />
      </ErrorBoundary>
    );
  },
  LocalityGeoRef({ resource }) {
    const locality = toTable(resource, 'Locality');
    return locality === undefined ? null : (
      <ErrorBoundary dismissable>
        <GeoLocatePlugin resource={locality} />
      </ErrorBoundary>
    );
  },
  WebLinkButton({
    resource,
    id,
    name,
    field,
    pluginDefinition: { webLink, icon },
    formType,
    mode,
  }) {
    return (
      <ErrorBoundary dismissable>
        <WebLink
          id={id}
          name={name}
          field={field}
          formType={formType}
          icon={icon}
          mode={mode}
          resource={resource}
          webLink={webLink}
        />
      </ErrorBoundary>
    );
  },
  AttachmentPlugin({ resource, mode, id, name }) {
    /*
     * Even though this permission is checked at form parse, still have to check
     * it as webOnlyViews.ts uses this plugin for ObjectAttachment view
     */
    if (hasTablePermission('Attachment', 'read'))
      return (
        <AttachmentsPlugin
          id={id}
          name={name}
          mode={mode}
          resource={resource}
        />
      );
    else {
      console.error(
        "Can't display AttachmentPlugin. User has no read access to Attachment table"
      );
      return null;
    }
  },
  HostTaxonPlugin({
    resource,
    mode,
    id,
    formType,
    isRequired,
    pluginDefinition: { relationship },
  }) {
    const collectingEventAttribute = toTable(
      resource,
      'CollectingEventAttribute'
    );
    if (relationship === undefined) {
      console.error(
        "Can't display HostTaxonPlugin because initialize.relname is not set"
      );
      return null;
    } else if (collectingEventAttribute === undefined) return null;
    else
      return (
        <ErrorBoundary dismissable>
          <HostTaxon
            formType={formType}
            id={id}
            isRequired={isRequired}
            mode={mode}
            relationship={relationship}
            resource={collectingEventAttribute}
          />
        </ErrorBoundary>
      );
  },
  LocalityGoogleEarth({ resource, id }) {
    const locality = toTable(resource, 'Locality');
    return locality === undefined ? null : (
      <ErrorBoundary dismissable>
        <LeafletPlugin id={id} locality={locality} />
      </ErrorBoundary>
    );
  },
  PaleoMap: PaleoLocationMapPlugin,
  WrongTable({ resource, pluginDefinition: { supportedTables } }) {
    return (
      <WrongPluginTable resource={resource} supportedTables={supportedTables} />
    );
  },
  Unsupported({ pluginDefinition: { name = commonText.nullInline() }, id }) {
    const [isVisible, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Small className="w-fit" id={id} onClick={handleShow}>
          {formsText.unavailablePluginButton()}
        </Button.Small>
        <Dialog
          buttons={commonText.close()}
          header={formsText.pluginNotAvailable()}
          isOpen={isVisible}
          onClose={handleHide}
        >
          {formsText.pluginNotAvailableDescription()}
          <br />
          {formsText.pluginNotAvailableSecondDescription()}
          <br />
          {commonText.colonLine({
            label: formsText.pluginName(),
            value: name,
          })}
        </Dialog>
      </>
    );
  },
  Blank: () => null,
};

export function FormPlugin({
  id,
  name,
  resource,
  mode,
  fieldDefinition,
  field,
  formType,
  isRequired,
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly fieldDefinition: FieldTypes['Plugin'];
  readonly field: LiteralField | Relationship | undefined;
  readonly formType: FormType;
  readonly isRequired: boolean;
}): JSX.Element {
  const Renderer = pluginRenderers[
    fieldDefinition.pluginDefinition.type
  ] as typeof pluginRenderers.AttachmentPlugin;
  return (
    <Renderer
      id={id}
      name={name}
      field={field}
      formType={formType}
      isRequired={isRequired}
      mode={mode}
      pluginDefinition={
        fieldDefinition.pluginDefinition as UiPlugins['AttachmentPlugin']
      }
      resource={resource}
    />
  );
}

export function WrongPluginTable({
  resource,
  supportedTables,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly supportedTables: RA<keyof Tables>;
}): JSX.Element {
  const [isVisible, handleShow, handleHide] = useBooleanState();
  return (
    <>
      <Button.Small onClick={handleShow}>
        {formsText.unavailablePluginButton()}
      </Button.Small>
      <Dialog
        buttons={commonText.close()}
        header={formsText.pluginNotAvailable()}
        isOpen={isVisible}
        onClose={handleHide}
      >
        {formsText.wrongTableForPlugin({
          currentTable: resource.specifyModel.name,
          correctTable: formatList(supportedTables),
        })}
      </Dialog>
    </>
  );
}
