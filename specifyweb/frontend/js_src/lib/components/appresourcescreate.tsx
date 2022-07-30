import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import type { AppResourceMode } from '../appresourceshelpers';
import type { SpAppResourceDir } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { addMissingFields, serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { mappedFind } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import type { IR, RR } from '../types';
import { ensure } from '../types';
import { userInformation } from '../userinfo';
import type { AppResourcesOutlet } from './appresources';
import type { AppResourcesTree } from './appresourceshooks';
import { useResourcesTree } from './appresourceshooks';
import { Button, Link, Ul } from './basic';
import { icons } from './icons';
import { Dialog } from './modaldialog';
import { NotFoundView } from './notfoundview';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { OverlayContext } from './router';

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

export function CreateAppResource(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const { directoryKey = '' } = useParams();
  const {
    getSet: [resources],
  } = useOutletContext<AppResourcesOutlet>();
  const resourcesTree = useResourcesTree(resources);
  const directory = React.useMemo(
    () => findDirectory(resourcesTree, directoryKey),
    [resourcesTree, directoryKey]
  );

  const [name, setName] = React.useState<string>('');
  const [type, setType] = React.useState<AppResourceType | undefined>(
    undefined
  );
  const [mimeType, setMimeType] = React.useState<string | undefined>(undefined);
  return directory === undefined ? (
    <NotFoundView />
  ) : type === undefined ? (
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
  ) : mimeType === undefined ? (
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
    />
  );
}

export const findDirectory = (
  tree: AppResourcesTree,
  searchKey: string
): SerializedResource<SpAppResourceDir> | undefined =>
  mappedFind(tree, ({ key, directory, subCategories }) =>
    key === searchKey ? directory : findDirectory(subCategories, searchKey)
  );

function EditAppResource({
  directory,
  name,
  type,
  mimeType,
}: {
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly name: string;
  readonly type: AppResourceType;
  readonly mimeType: string | undefined;
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

  const handleClose = React.useContext(OverlayContext);
  const navigate = useNavigate();
  const { directoryKey = '' } = useParams();

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
        const path =
          type.tableName === 'SpAppResource' ? 'app-resource' : 'view-set';
        navigate(`/specify/resources/${path}/new/`, {
          state: {
            resource: serializeResource(resource),
            directoryKey,
            noUnloadProtect: true,
          },
        });
        /*
         * Prevent saving a resource to fix
         * https://github.com/specify/specify7/issues/1596
         */
        return false;
      }}
    />
  );
}
