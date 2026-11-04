/**
 * Catalog Num Format Name pick list scoped to a Collection's target discipline
 * (+ global/backstop), not the login collection's UIFormatters session.
 *
 * @see https://github.com/specify/specify7/issues/8678
 */

import React from 'react';

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

/**
 * Stable key for the formats we intend to show. Used to ignore stale responses
 * when discipline changes while a request is in flight.
 */
function catalogNumberFormatRequestKey(
  resource: DefaultComboBoxProps['resource']
): string {
  if (resource?.specifyTable.name === 'Collection') {
    const discipline = resource.get('discipline');
    return typeof discipline === 'string'
      ? `collection:${discipline}`
      : 'collection:none';
  }
  return 'session';
}

async function fetchCatalogNumberFormatItems(
  resource: DefaultComboBoxProps['resource']
): Promise<RA<PickListItemSimple>> {
  // Collection: only show formats for its target discipline (never login session).
  if (resource?.specifyTable.name === 'Collection') {
    const discipline = resource.get('discipline');
    const disciplineId =
      typeof discipline === 'string' ? idFromUrl(discipline) : undefined;
    if (typeof disciplineId !== 'number') {
      return [];
    }

    const { data } = await ajax<{ readonly names: RA<string> }>(
      `/context/catalog_number_format_names.json?discipline=${disciplineId}`,
      {
        headers: { Accept: 'application/json' },
      }
    );

    return data.names.map((name) => ({ value: name, title: name }));
  }

  // Other tables (e.g. CollectionObjectType) keep session UIFormatters.
  return sessionCatalogNumberFormatItems();
}

export function CatalogNumberFormatPickList(
  props: DefaultComboBoxProps
): JSX.Element {
  const [items, setItems] = React.useState<
    RA<PickListItemSimple> | undefined
  >(undefined);
  const requestIdRef = React.useRef(0);

  const loadItems = React.useCallback(() => {
    const resource = props.resource;
    const requestId = ++requestIdRef.current;
    const expectedKey = catalogNumberFormatRequestKey(resource);

    void fetchCatalogNumberFormatItems(resource)
      .then((nextItems) => {
        if (requestId !== requestIdRef.current) return;
        if (catalogNumberFormatRequestKey(resource) !== expectedKey) return;
        setItems(nextItems);
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setItems(undefined);
        raise(error);
      });
  }, [props.resource]);

  React.useEffect(() => {
    setItems(undefined);
    loadItems();

    if (props.resource === undefined) return undefined;

    return resourceOn(
      props.resource,
      'change:discipline',
      (): void => {
        setItems(undefined);
        loadItems();
      },
      false
    );
  }, [props.resource, loadItems]);

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
