import React from 'react';

import type { AppResourceMode } from '../appresourceshelpers';
import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { addMissingFields } from '../datamodelutils';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { schema } from '../schema';
import type { IR, RR } from '../types';
import { userInformation } from '../userinfo';
import { Button, Form, Input, Label, Link, Submit, Ul } from './basic';
import { useId } from './hooks';
import { icons } from './icons';
import { Dialog } from './modaldialog';

type AppResourceType = {
  readonly tableName: 'SpAppResource' | 'SpViewSetObject';
  readonly icon: JSX.Element;
  readonly label: string;
};

export const appResourceTypes: RR<AppResourceMode, AppResourceType> = {
  appResources: {
    tableName: 'SpAppResource',
    icon: icons.cog,
    label: adminText('appResource'),
  },
  viewSets: {
    tableName: 'SpViewSetObject',
    icon: icons.pencilAt,
    label: adminText('formDefinitions'),
  },
};

type AppResourceSubType = {
  readonly mimeType: string | undefined;
  readonly name: string | undefined;
  readonly documentationUrl: string | undefined;
  readonly icon: JSX.Element;
  readonly label: string;
};

export const appResourceSubTypes: IR<AppResourceSubType> = {
  label: {
    mimeType: 'jrxml/label',
    name: undefined,
    documentationUrl:
      'https://discourse.specifysoftware.org/c/7-docs/7-labels/63',
    icon: icons.documentReport,
    label: adminText('label'),
  },
  report: {
    mimeType: 'jrxml/report',
    name: undefined,
    documentationUrl:
      'https://discourse.specifysoftware.org/c/7-docs/7-labels/63',
    icon: icons.ticket,
    label: adminText('report'),
  },
  userPreferences: {
    mimeType: 'application/json',
    name: 'UserPreferences',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Setting-default-user-preferences',
    icon: icons.cog,
    label: adminText('userPreferences'),
  },
  defaultUserPreferences: {
    mimeType: 'application/json',
    name: 'DefaultUserPreferences',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Setting-default-user-preferences',
    icon: icons.cog,
    label: adminText('defaultUserPreferences'),
  },
  leafletLayers: {
    mimeType: 'application/json',
    name: 'leaflet-layers',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Adding-Custom-Tile-Servers',
    icon: icons.locationMarker,
    label: adminText('leafletLayers'),
  },
  rssExportFeed: {
    mimeType: 'text/xml',
    name: 'leaflet-layers',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Darwin-Core-Archive-Publishing',
    icon: icons.upload,
    label: adminText('rssExportFeed'),
  },
  expressSearchConfig: {
    mimeType: 'text/xml',
    name: 'ExpressSearchConfig',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/simple-search-config/183',
    icon: icons.search,
    label: adminText('expressSearchConfig'),
  },
  webLinks: {
    mimeType: 'text/xml',
    name: 'WebLinks',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/common/weblinks.xml',
    icon: icons.externalLink,
    label: adminText('webLinks'),
  },
  uiFormatters: {
    mimeType: 'text/xml',
    name: 'UIFormatters',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/uiformatters.xml',
    icon: icons.hashtag,
    label: adminText('uiFormatters'),
  },
  dataObjectFormatters: {
    mimeType: 'text/xml',
    name: 'DataObjFormatters',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/dataobj_formatters.xml',
    icon: icons.variable,
    label: adminText('dataObjectFormatters'),
  },
  searchDialogDefinitions: {
    mimeType: 'text/xml',
    name: 'DialogDefs',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/dialog_defs.xml',
    icon: icons.documentSearch,
    label: adminText('searchDialogDefinitions'),
  },
  dataEntryTables: {
    mimeType: 'text/xml',
    name: 'DataEntryTaskInit',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/fish/dataentry_task.xml',
    icon: icons.pencilAt,
    label: adminText('dataEntryTables'),
  },
  interactionsTables: {
    mimeType: 'text/xml',
    name: 'InteractionsTaskInit',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/common/interactionstask.xml',
    icon: icons.chat,
    label: adminText('interactionsTables'),
  },
  otherXmlResource: {
    mimeType: 'text/xml',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.cog,
    label: adminText('otherXmlResource'),
  },
  otherJsonResource: {
    mimeType: 'application/json',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.cog,
    label: adminText('otherJsonResource'),
  },
  otherPropertiesResource: {
    mimeType: 'text/x-java-properties',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.cog,
    label: adminText('otherPropertiesResource'),
  },
  otherAppResources: {
    mimeType: undefined,
    name: undefined,
    documentationUrl: undefined,
    icon: icons.cog,
    label: adminText('otherAppResource'),
  },
};

export function CreateAppResource({
  directory,
  onClose: handleClose,
  onSelected: handleSelected,
}: {
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly onClose: () => void;
  readonly onSelected: (
    resource: SerializedResource<SpAppResource | SpViewSetObject>
  ) => void;
}): JSX.Element {
  const [name, setName] = React.useState<string>('');
  const id = useId('create-app-resource');
  const [type, setType] = React.useState<AppResourceType | undefined>(
    undefined
  );
  const [mimeType, setMimeType] = React.useState<string | undefined>(undefined);
  return type === undefined ? (
    <Dialog
      header={adminText('selectResourceType')}
      onClose={handleClose}
      buttons={commonText('cancel')}
    >
      <Ul className="flex flex-col">
        {Object.entries(appResourceTypes).map(([key, type]) => (
          <li key={key} className="contents">
            <Button.LikeLink
              onClick={(): void => {
                setType(type);
                if (key === 'viewSets') setMimeType('text/xml');
              }}
            >
              {type.icon}
              {type.label}
            </Button.LikeLink>
          </li>
        ))}
      </Ul>
    </Dialog>
  ) : mimeType === undefined ? (
    <Dialog
      header={adminText('selectResourceTypeDialogHeader')}
      onClose={handleClose}
      buttons={commonText('cancel')}
    >
      <table className="grid-table grid-cols-2 gap-2">
        <thead>
          <tr>
            <th scope="col">{commonText('type')}</th>
            <th scope="col">{commonText('documentation')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(appResourceSubTypes).map(
            ([key, { icon, mimeType, name, documentationUrl, label }]) => (
              <tr key={key}>
                <td>
                  <Button.LikeLink
                    onClick={(): void => {
                      setMimeType(mimeType);
                      setName(name ?? '');
                    }}
                  >
                    {icon}
                    {label}
                  </Button.LikeLink>
                </td>
                <td>
                  {typeof documentationUrl === 'string' && (
                    <Link.NewTab href={documentationUrl}>
                      {commonText('documentation')}
                    </Link.NewTab>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </Dialog>
  ) : (
    <Dialog
      header={adminText('createResourceDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('create')}</Submit.Blue>
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          handleSelected(
            addMissingFields(type.tableName as 'SpAppResource', {
              // I don't think this field is used anywhere
              level: 0,
              mimeType,
              name: name.trim(),
              specifyUser: userInformation.resource_uri,
              spAppResourceDir: directory.resource_uri,
            })
          )
        }
      >
        <Label.Generic>
          {schema.models.SpAppResource.getField('name')!.label}
          <Input.Text value={name} onValueChange={setName} required />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}
