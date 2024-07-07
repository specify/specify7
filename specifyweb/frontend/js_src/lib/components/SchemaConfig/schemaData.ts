import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { GetOrSet, IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { index } from '../../utils/utils';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { LiteralField } from '../DataModel/specifyField';
import type { SpLocaleContainer, Tables } from '../DataModel/types';
import { fetchContext as fetchUiFormatters } from '../FieldFormatters';
import { fetchFormatters } from '../Formatters/formatters';
import { fetchPickLists } from '../PickLists/definitions';
import { fetchSchemaLanguages } from '../Toolbar/Language';
import { webLinks } from '../WebLinks';
import type { WebLink } from '../WebLinks/spec';
import { formatAggregators } from './helpers';

type RawSchemaData = {
  readonly languages: IR<LocalizedString>;
  readonly tables: IR<SerializedResource<SpLocaleContainer>>;
  readonly formatters: RA<SchemaFormatter>;
  readonly aggregators: RA<SchemaFormatter>;
  readonly uiFormatters: RA<SimpleFieldFormatter>;
  readonly webLinks: RA<WebLink & { readonly index: number }>;
  readonly pickLists: IR<{
    readonly name: string;
    readonly isSystem: boolean;
  }>;
};

export type SchemaData = RawSchemaData & {
  readonly update: GetOrSet<RawSchemaData | undefined>[1];
};

export type SchemaFormatter = {
  readonly name: string;
  readonly title: LocalizedString;
  readonly tableName: keyof Tables | undefined;
  readonly index: number;
};

type SimpleFieldFormatter = {
  readonly name: string;
  readonly isSystem: boolean;
  readonly value: string;
  readonly field: LiteralField | undefined;
  readonly tableName: keyof Tables | undefined;
};

export const fetchSchemaData = async (): Promise<RawSchemaData> =>
  f.all({
    languages: fetchSchemaLanguages(),
    tables: fetchCollection('SpLocaleContainer', {
      limit: 0,
      domainFilter: true,
      schemaType: 0,
    }).then(({ records }) => index(records)),
    formatters: fetchFormatters.then(({ formatters }) =>
      formatAggregators(formatters)
    ),
    aggregators: fetchFormatters.then(({ aggregators }) =>
      formatAggregators(aggregators)
    ),
    uiFormatters: fetchUiFormatters.then((formatters) =>
      Object.entries(formatters)
        .map(([name, formatter]) => ({
          name,
          isSystem: formatter.isSystem,
          value: formatter.defaultValue,
          field: formatter.field,
          tableName: formatter.table?.name,
        }))
        .filter(({ value }) => value)
    ),
    webLinks: webLinks.then((webLinks) =>
      webLinks.map((webLink, index) => ({ ...webLink, index }))
    ),
    pickLists: fetchSchemaPickLists(),
  });

export const fetchSchemaPickLists = async (): Promise<
  SchemaData['pickLists']
> =>
  fetchPickLists().then((pickLists) =>
    Object.fromEntries(
      filterArray(Object.values(pickLists))
        .map(serializeResource)
        .map(({ id, name, isSystem }) => [
          id,
          {
            name,
            isSystem,
          },
          // Filter out front-end only pick lists
        ])
        .filter(([id]) => typeof id === 'number')
    )
  );
