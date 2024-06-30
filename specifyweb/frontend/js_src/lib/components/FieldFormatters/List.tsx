import React from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import type { GetSet, RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { XmlEntryList } from '../Formatters/List';
import { SafeOutlet } from '../Router/RouterUtils';
import { updateXml } from '../Syncer/xmlToString';
import { FieldFormattersContext } from './Editor';
import type { FieldFormatter } from './spec';

export type FieldFormattersOutlet = {
  readonly items: GetSet<RA<FieldFormatter>>;
};

export function FieldFormatterEditorWrapper(): JSX.Element {
  const {
    parsed: [parsed, setParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(FieldFormattersContext)!;

  return (
    <SafeOutlet<FieldFormattersOutlet>
      items={[
        parsed.fieldFormatters,
        (fieldFormatters): void => {
          const newParsed = { ...parsed, fieldFormatters };
          setParsed(newParsed);
          handleChange(() => updateXml(deserializer(newParsed)));
        },
      ]}
    />
  );
}

export function FieldFormattersList(): JSX.Element {
  const { tableName } = useParams();
  const { items } = useOutletContext<FieldFormattersOutlet>();

  return (
    <XmlEntryList
      getNewItem={(currentItems, table): FieldFormatter => {
        const newName = getUniqueName(
          table.name,
          currentItems.map((item) => item.name),
          undefined,
          'name'
        );
        const newTitle = getUniqueName(
          table.label,
          currentItems.map((item) => item.title ?? '')
        );
        return {
          isSystem: false,
          name: newName,
          title: newTitle,
          table,
          field: undefined,
          isDefault: currentItems.length === 0,
          legacyType: undefined,
          legacyPartialDate: undefined,
          autoNumber: false,
          external: undefined,
          fields: [],
          raw: {
            javaClass: undefined,
            legacyAutoNumber: undefined,
          },
        };
      }}
      header={resourcesText.availableFieldFormatters()}
      items={items}
      tableName={tableName}
    />
  );
}
