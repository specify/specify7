import React from 'react';

import type { Tables } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { FormMode, FormType } from '../FormParse';
import type { FieldTypes } from '../FormParse/fields';
import type { UiPlugins } from '../FormParse/plugins';
import { hasTablePermission } from '../Permissions/helpers';
import { AttachmentsPlugin } from '../Attachments/Plugin';
import { Button } from '../Atoms/Button';
import { CollectionOneToManyPlugin } from './CollectionRelOneToMany';
import { CollectionOneToOnePlugin } from './CollectionRelOneToOne';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { GeoLocatePlugin } from './GeoLocate';
import { HostTaxon } from './HostTaxon';
import { LatLongUi } from './LatLongUi';
import { LeafletPlugin } from './Leaflet';
import { Dialog } from '../Molecules/Dialog';
import { PaleoLocationMapPlugin } from './PaleoLocation';
import { PartialDateUi } from './PartialDateUi';
import { WebLink } from './WebLink';
import { useBooleanState } from '../../hooks/useBooleanState';
import { AnySchema } from '../DataModel/helperTypes';
import { toTable } from '../DataModel/helpers';

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
        buttons={commonText('close')}
        header={formsText('unavailablePluginDialogHeader')}
        isOpen={isVisible}
        onClose={handleHide}
      >
        {formsText(
          'wrongTablePluginDialogText',
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
  LatLonUI({ resource, mode, id, pluginDefinition: { step, latLongType } }) {
    return (
      f.maybe(toTable(resource, 'Locality'), (locality) => (
        <LatLongUi
          id={id}
          mode={mode}
          resource={locality}
          step={step}
          latLongType={latLongType}
        />
      )) ?? <WrongTable allowedTable="Locality" resource={resource} />
    );
  },
  PartialDateUI: ({
    id,
    resource,
    mode,
    fieldName,
    formType,
    pluginDefinition: {
      defaultValue,
      dateField,
      defaultPrecision,
      precisionField,
    },
  }) => {
    const field = dateField ?? fieldName;
    if (field === undefined) {
      console.error(
        "Can't display PartialDateUi because initialize.df is not set"
      );
      return null;
    } else
      return (
        <ErrorBoundary dismissable>
          <PartialDateUi
            canChangePrecision={formType === 'form'}
            dateField={field}
            defaultPrecision={defaultPrecision}
            defaultValue={defaultValue}
            id={id}
            isReadOnly={mode === 'view'}
            precisionField={precisionField}
            resource={resource}
          />
        </ErrorBoundary>
      );
  },
  CollectionRelOneToManyPlugin({
    resource,
    pluginDefinition: { relationship },
  }) {
    if (relationship === undefined) {
      console.error(
        "Can't display CollectionRelOneToManyPlugin because initialize.relname is not set"
      );
      return null;
    } else
      return !hasTablePermission('CollectionRelationship', 'read') ||
        !hasTablePermission('CollectionRelType', 'read')
        ? null
        : f.maybe(toTable(resource, 'CollectionObject'), (collectionObject) => (
            <ErrorBoundary dismissable>
              <CollectionOneToManyPlugin
                relationship={relationship}
                resource={collectionObject}
              />
            </ErrorBoundary>
          )) ?? (
            <WrongTable allowedTable="CollectionObject" resource={resource} />
          );
  },
  ColRelTypePlugin({ resource, pluginDefinition: { relationship } }) {
    if (relationship === undefined) {
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
            <ErrorBoundary dismissable>
              <CollectionOneToOnePlugin
                relationship={relationship}
                resource={collectionObject}
              />
            </ErrorBoundary>
          )) ?? (
            <WrongTable allowedTable="CollectionObject" resource={resource} />
          );
  },
  LocalityGeoRef({ resource }) {
    return (
      f.maybe(toTable(resource, 'Locality'), (locality) => (
        <ErrorBoundary dismissable>
          <GeoLocatePlugin resource={locality} />
        </ErrorBoundary>
      )) ?? <WrongTable allowedTable="Locality" resource={resource} />
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
      <ErrorBoundary dismissable>
        <WebLink
          fieldName={fieldName}
          formType={formType}
          icon={icon}
          id={id}
          mode={mode}
          resource={resource}
          webLink={webLink}
        />
      </ErrorBoundary>
    );
  },
  AttachmentPlugin({ resource, mode, id, fieldName }) {
    if (hasTablePermission('Attachment', 'read'))
      return (
        <AttachmentsPlugin
          id={id}
          mode={mode}
          name={fieldName}
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
    if (relationship === undefined) {
      console.error(
        "Can't display HostTaxonPlugin because initialize.relname is not set"
      );
      return null;
    } else
      return hasTablePermission('CollectionRelType', 'read') ? (
        <HostTaxon
          formType={formType}
          id={id}
          isRequired={isRequired}
          mode={mode}
          relationship={relationship}
          resource={resource}
        />
      ) : null;
  },
  LocalityGoogleEarth({ resource, id }) {
    return (
      f.maybe(toTable(resource, 'Locality'), (locality) => (
        <LeafletPlugin id={id} locality={locality} />
      )) ?? <WrongTable allowedTable="Locality" resource={resource} />
    );
  },
  PaleoMap: PaleoLocationMapPlugin,
  Unsupported({ pluginDefinition: { name = commonText('nullInline') }, id }) {
    const [isVisible, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Small className="w-fit" id={id} onClick={handleShow}>
          {formsText('unavailablePluginButton')}
        </Button.Small>
        <Dialog
          buttons={commonText('close')}
          header={formsText('unavailablePluginDialogHeader')}
          isOpen={isVisible}
          onClose={handleHide}
        >
          {formsText('unavailablePluginDialogText')}
          <br />
          {`${formsText('pluginName')} ${name}`}
        </Dialog>
      </>
    );
  },
};

export function FormPlugin({
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
      fieldName={fieldName}
      formType={formType}
      id={id}
      isRequired={isRequired}
      mode={mode}
      pluginDefinition={
        fieldDefinition.pluginDefinition as UiPlugins['AttachmentPlugin']
      }
      resource={resource}
    />
  );
}
