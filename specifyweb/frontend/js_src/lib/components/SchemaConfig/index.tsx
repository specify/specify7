import React from 'react';
import { useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { PartialBy } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { strictGetTable } from '../DataModel/tables';
import type { SpLocaleItemStr } from '../DataModel/types';
import { useTitle } from '../Molecules/AppTitle';
import { SchemaConfigField } from './Field';
import { SchemaConfigColumn, SchemaConfigFields } from './Fields';
import { useSchemaConfig, useSchemaConfigTable } from './Store';
import { SchemaConfigTable } from './Table';

export type SpLocaleItemString = SerializedResource<SpLocaleItemStr>;
export type NewSpLocaleItemString = PartialBy<SpLocaleItemString, 'id'>;

export type ItemType = 'formatted' | 'none' | 'pickList' | 'webLink';

export function SchemaConfigMain(): JSX.Element {
  const { tableName = '' } = useParams();
  const table = strictGetTable(tableName);
  useTitle(schemaText.schemaViewTitle({ tableName: table.name }));

  const { schemaData } = useSchemaConfig();
  const {
    container,
    name,
    desc,
    items,
    setContainer,
    setName,
    setDesc,
    setItem,
  } = useSchemaConfigTable(table.name);

  const [index, setIndex] = React.useState(0);
  const [previousTableName, setPreviousTableName] = React.useState(table.name);
  if (previousTableName !== table.name) {
    setPreviousTableName(table.name);
    setIndex(0);
  }
  const item = items?.[index];
  const field =
    typeof item === 'object' ? table.getField(item.name) : undefined;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto sm:flex-row sm:overflow-hidden">
      <SchemaConfigTable
        container={container}
        desc={desc}
        name={name}
        schemaData={schemaData}
        onChange={setContainer}
        onChangeDesc={setDesc}
        onChangeName={setName}
      />
      <SchemaConfigFields
        index={index}
        items={items}
        table={table}
        onChange={setIndex}
      />
      {typeof item === 'object' && field !== undefined ? (
        <SchemaConfigField
          field={field}
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
  );
}
