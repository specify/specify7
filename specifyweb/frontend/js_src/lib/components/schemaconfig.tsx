import React from 'react';

import { ping } from '../ajax';
import type { SpLocaleItemStr as SpLocaleItemString_ } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { commonText } from '../localization/common';
import { hasToolPermission } from '../permissionutils';
import { formatUrl } from '../querystring';
import { createResource, saveResource } from '../resource';
import type { SpecifyModel } from '../specifymodel';
import type { PartialBy } from '../types';
import { Container } from './basic';
import { LoadingContext } from './contexts';
import { useUnloadProtect } from './navigation';
import { SchemaConfigHeader } from './schemaconfigcomponents';
import { SchemaConfigField } from './schemaconfigfield';
import { SchemaConfigColumn, SchemaConfigFields } from './schemaconfigfields';
import {
  useContainer,
  useContainerItems,
  useContainerString,
} from './schemaconfighooks';
import type { SchemaData } from './schemaconfigsetuphooks';
import { SchemaConfigTable } from './schemaconfigtable';

export type SpLocaleItemString = SerializedResource<SpLocaleItemString_>;
export type NewSpLocaleItemString = PartialBy<SpLocaleItemString, 'id'>;

export type ItemType = 'formatted' | 'none' | 'pickList' | 'webLink';

export function SchemaConfigMain({
  schemaData,
  language: rawLanguage,
  model,
  onBack: handleBack,
}: {
  readonly schemaData: SchemaData;
  readonly language: string;
  readonly model: SpecifyModel;
  readonly onBack: () => void;
}): JSX.Element {
  const isReadOnly =
    !hasToolPermission('schemaConfig', 'update') ||
    !hasToolPermission('schemaConfig', 'create');

  const [container, setContainer, isChanged] = useContainer(
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
    commonText('unsavedSchemaUnloadProtect')
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
      ...(isChanged
        ? [
            saveResource('SpLocaleContainer', container.id, container),
            saveString(name),
            saveString(desc),
          ]
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
        onBack={handleBack}
        onSave={canSave ? handleSave : undefined}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-hidden sm:flex-row">
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
          <SchemaConfigColumn header={commonText('loading')}>
            {commonText('loading')}
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
      globalThis.location.assign(
        formatUrl('/specify/task/schema-config/', { rawLanguage })
      )
    );
