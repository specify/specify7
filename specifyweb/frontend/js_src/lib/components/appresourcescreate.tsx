import React from 'react';

import type { AppResourceMode } from '../appresourceshelpers';
import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { addMissingFields, serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import type { IR, RR } from '../types';
import { ensure } from '../types';
import { userInformation } from '../userinfo';
import { Button, Link, Ul } from './basic';
import { icons } from './icons';
import { Dialog } from './modaldialog';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';

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

/**
 * The order of the subtypes matters. The filtering algorithm loops over these
 * in the order they are defined to find the first subType that matches the
 * current resource. Thus, subtypes should be sorted from the most
 * specific to the least specific.
 */
export const appResourceSubTypes = {
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
    name: 'ExportFeed',
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
} as const;

ensure<IR<AppResourceSubType>>()(appResourceSubTypes);

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
  const [type, setType] = React.useState<AppResourceType | undefined>(
    undefined
  );
  const [mimeType, setMimeType] = React.useState<string | undefined>(undefined);
  return type === undefined ? (
    <Dialog
      buttons={commonText('cancel')}
      header={adminText('selectResourceType')}
      onClose={handleClose}
    >
      <Ul className="flex flex-col">
        {Object.entries(appResourceTypes).map(([key, type]) => (
          <li className="contents" key={key}>
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
  ) : (mimeType === undefined ? (
    <Dialog
      buttons={commonText('cancel')}
      header={adminText('selectResourceTypeDialogHeader')}
      onClose={handleClose}
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
    <EditAppResource
      directory={directory}
      mimeType={mimeType}
      name={name}
      type={type}
      onClose={handleClose}
      onSelected={handleSelected}
    />
  ));
}

function EditAppResource({
  directory,
  name,
  type,
  mimeType,
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly name: string;
  readonly type: AppResourceType;
  readonly mimeType: string | undefined;
  readonly onSelected: (
    resource: SerializedResource<SpAppResource | SpViewSetObject>
  ) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const resource = React.useMemo(
    () =>
      deserializeResource(
        addMissingFields(type.tableName as 'SpAppResource', {
          // I don't think this field is used anywhere
          level: 0,
          mimeType,
          name: name.trim(),
          specifyUser: userInformation.resource_uri,
          spAppResourceDir: directory.resource_uri,
        })
      ),
    [directory, name, type, mimeType]
  );
  return (
    <ResourceView
      canAddAnother={false}
      dialog="modal"
      isDependent={false}
      isSubForm={false}
      mode="edit"
      resource={resource}
      onClose={handleClose}
      onDeleted={undefined}
      onSaved={f.never}
      onSaving={(): false => {
        handleSelected(serializeResource(resource));
        return false;
      }}
    />
  );
}
