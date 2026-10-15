/**
 * Catalog Num Format Name pick list scoped to a Collection's target discipline
 * (+ global/backstop), not the login collection's UIFormatters session.
 *
 * @see https://github.com/specify/specify7/issues/8678
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { idFromUrl, resourceOn } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import { raise } from '../Errors/Crash';
import { getUiFormatters } from '../FieldFormatters';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { PickListComboBox } from './index';

const sessionCatalogNumberFormatItems = (): RA<PickListItemSimple> => {
  const catalogNumberField =
    tables.CollectionObject.strictGetLiteralField('catalogNumber');
  return Object.entries(getUiFormatters())
    .filter(([_, formatter]) => formatter.field === catalogNumberField)
    .map(([formatterName]) => ({
      value: formatterName,
      title: formatterName,
    }));
};

async function fetchCatalogNumberFormatItems(
  disciplineId: number | undefined
): Promise<RA<PickListItemSimple>> {
  if (typeof disciplineId !== 'number') {
    return sessionCatalogNumberFormatItems();
  }

  const { data } = await ajax<{ readonly names: RA<string> }>(
    `/context/catalog_number_format_names.json?discipline=${disciplineId}`,
    {
      headers: { Accept: 'application/json' },
    }
  );

  return data.names.map((name) => ({ value: name, title: name }));
}

function disciplineIdFromResource(
  resource: DefaultComboBoxProps['resource']
): number | undefined {
  if (resource === undefined) return undefined;
  if (resource.specifyTable.name === 'Collection') {
    const discipline = resource.get('discipline');
    return typeof discipline === 'string' ? idFromUrl(discipline) : undefined;
  }
  return undefined;
}

export function CatalogNumberFormatPickList(
  props: DefaultComboBoxProps
): JSX.Element {
  const fetchItems = React.useCallback(
    async () => fetchCatalogNumberFormatItems(disciplineIdFromResource(props.resource)),
    [props.resource]
  );

  const [items, setItems] = useAsyncState<RA<PickListItemSimple>>(
    fetchItems,
    false
  );

  React.useEffect(
    () =>
      props.resource === undefined
        ? undefined
        : resourceOn(
            props.resource,
            'change:discipline',
            (): void => {
              fetchItems()
                .then(setItems)
                .catch((error) => {
                  setItems(undefined);
                  raise(error);
                });
            },
            true
          ),
    [props.resource, fetchItems, setItems]
  );

  return (
    <PickListComboBox
      {...props}
      isDisabled={props.isDisabled || items === undefined}
      items={items ?? []}
      pickList={undefined}
      onAdd={undefined}
    />
  );
}
