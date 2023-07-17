import React from 'react';
import { useOutletContext } from 'react-router';
import { useParams } from 'react-router-dom';

import { useUnloadProtect } from '../../hooks/navigation';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ping } from '../../utils/ajax/ping';
import type { PartialBy } from '../../utils/types';
import { Container } from '../Atoms';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource, saveResource } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
import type { SpLocaleItemStr } from '../DataModel/types';
import { useTitle } from '../Molecules/AppTitle';
import { hasToolPermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { SchemaConfigHeader } from './Components';
import { SchemaConfigField } from './Field';
import { SchemaConfigColumn, SchemaConfigFields } from './Fields';
import {
  useContainerItems,
  useContainerString,
  useSchemaContainer,
} from './Hooks';
import type { SchemaData } from './SetupHooks';
import { SchemaConfigTable } from './Table';

export type SpLocaleItemString = SerializedResource<SpLocaleItemStr>;
export type NewSpLocaleItemString = PartialBy<SpLocaleItemString, 'id'>;

export type ItemType = 'formatted' | 'none' | 'pickList' | 'webLink';

export function SchemaConfigMain(): JSX.Element {
  const { language: rawLanguage = '', tableName = '' } = useParams();
  const model = strictGetModel(tableName);

  useTitle(schemaText.schemaViewTitle({ tableName }));

  const schemaData = useOutletContext<SchemaData>();
  const isReadOnly =
    !hasToolPermission('schemaConfig', 'update') ||
    !hasToolPermission('schemaConfig', 'create');

  const [container, setContainer, isChanged] = useSchemaContainer(
    schemaData.tables,
    model.name
  );
  const [language, country = null] = rawLanguage.split('-');
  const [name, setName, nameChanged] = useContainerString(
    'containerName',
    container,
    language,
    country
  );
  const [desc, setDesc, descChanged] = useContainerString(
    'containerDesc',
    container,
    language,
    country
  );
  const [items, setItem, changedItems] = useContainerItems(
    container,
    language,
    country
  );
  const [index, setIndex] = React.useState(0);
  const item = items?.[index];

  const isModified =
    isChanged || nameChanged || descChanged || changedItems.length > 0;
  const unsetUnloadProtect = useUnloadProtect(
    isModified,
    schemaText.unsavedSchemaUnloadProtect()
  );

  const canSave =
    !isReadOnly &&
    isModified &&
    typeof items === 'object' &&
    typeof name === 'object' &&
    typeof desc === 'object';

  function handleSave(): void {
    if (!canSave) return;
    unsetUnloadProtect();

    const requests = [
      ...(nameChanged ? [saveString(name)] : []),
      ...(descChanged ? [saveString(desc)] : []),
      ...(isChanged
        ? [saveResource('SpLocaleContainer', container.id, container)]
        : []),
      ...items
        .filter((_item, index) => changedItems.includes(index))
        .flatMap(({ strings, ...item }) => [
          saveResource('SpLocaleContainerItem', item.id, item),
          saveString(strings.name),
          saveString(strings.desc),
        ]),
    ];

    loading(Promise.all(requests).then(async () => handleSaved(rawLanguage)));
  }

  const loading = React.useContext(LoadingContext);
  return (
    <Container.Full>
      <SchemaConfigHeader
        language={language}
        languages={schemaData.languages}
        onSave={canSave ? handleSave : undefined}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto sm:flex-row sm:overflow-hidden">
        <SchemaConfigTable
          container={container}
          desc={desc}
          isReadOnly={isReadOnly}
          name={name}
          schemaData={schemaData}
          onChange={setContainer}
          onChangeDesc={setDesc}
          onChangeName={setName}
        />
        <SchemaConfigFields
          index={index}
          items={items}
          model={model}
          onChange={setIndex}
        />
        {typeof item === 'object' ? (
          <SchemaConfigField
            field={model.getField(item.name)!}
            isReadOnly={isReadOnly}
            item={item}
            schemaData={schemaData}
            onChange={(field, value): void =>
              setItem(index, {
                ...item,
                ...(field === 'desc' || field === 'name'
                  ? {
                      strings: {
                        ...item.strings,
                        [field]: {
                          ...item.strings[field],
                          text: value,
                        },
                      },
                    }
                  : {
                      [field]: value as boolean,
                    }),
              })
            }
            onFormatted={(format, value): void =>
              setItem(index, {
                ...item,
                format: format === 'formatted' ? value : null,
                webLinkName: format === 'webLink' ? value : null,
                pickListName: format === 'pickList' ? value : null,
              })
            }
          />
        ) : (
          <SchemaConfigColumn header={commonText.loading()}>
            {commonText.loading()}
          </SchemaConfigColumn>
        )}
      </div>
    </Container.Full>
  );
}

const saveString = async (
  resource: NewSpLocaleItemString | SpLocaleItemString
): Promise<unknown> =>
  'resource_uri' in resource &&
  typeof resource.id === 'number' &&
  resource.id >= 0
    ? saveResource('SpLocaleItemStr', resource.id, resource)
    : createResource('SpLocaleItemStr', resource);

const handleSaved = async (rawLanguage: string): Promise<void> =>
  ping(
    // Flush schema cache
    formatUrl('/context/schema_localization.json', {
      lang: rawLanguage,
    }),
    {
      method: 'HEAD',
      cache: 'no-cache',
    }
  )
    // Reload the page after schema changes
    .then((): void =>
      globalThis.location.assign(`/specify/schema-config/${rawLanguage}/`)
    );
