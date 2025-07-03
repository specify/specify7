import React from 'react';

import { useAsyncState, usePromise } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { resourcesText } from '../../localization/resources';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceFromUrl } from '../DataModel/resource';
import { fetchContext as fetchDomain, schema } from '../DataModel/schema';
import type { CollectionObjectType, Tables } from '../DataModel/types';
import { fetchFormatters } from '../Formatters/formatters';
import { customSelectElementBackground } from '../WbPlanView/CustomSelectElement';

type SimpleFormatter = {
  readonly name: string;
  readonly title: string;
  readonly isDefault: boolean;
};

type FormatterWithCOTs = SimpleFormatter & {
  readonly cotNames: RA<string>;
};

export function QueryFieldRecordFormatter({
  type,
  tableName,
  formatter,
  onChange: handleChange,
}: {
  readonly type: 'aggregator' | 'formatter';
  readonly tableName: keyof Tables;
  readonly formatter: string | undefined;
  readonly onChange: ((formatter: string | undefined) => void) | undefined;
}): JSX.Element | null {
  const [formatters] = usePromise(fetchFormatters, false);
  const availableFormatters = React.useMemo<RA<SimpleFormatter> | undefined>(
    () =>
      // Some code duplication, but required by TypeScript
      (type === 'formatter'
        ? formatters?.formatters.map(({ table, name, title, isDefault }) => ({
            table,
            name,
            title,
            isDefault,
          }))
        : formatters?.aggregators.map(({ table, name, title, isDefault }) => ({
            table,
            name,
            title,
            isDefault,
          }))
      )
        ?.filter(({ table }) => table?.name === tableName)
        .map(({ name, title = name, isDefault }) => ({
          name,
          title,
          isDefault,
        })),
    [type, formatters, tableName]
  );

  return (
    <FormatSelect
      availableFormatters={availableFormatters}
      currentFormat={formatter}
      onChange={handleChange}
    />
  );
}

export function CatalogNumberFormatSelection({
  formatter,
  onChange: handleChange,
}: {
  readonly formatter: string | undefined;
  readonly onChange: ((formatter: string | undefined) => void) | undefined;
}): JSX.Element | null {
  const [availableFormatters] = useAsyncState(
    React.useCallback(
      async () =>
        fetchDomain
          .then(async (schema) =>
            Promise.all(
              Object.keys(schema.collectionObjectTypeCatalogNumberFormats).map(
                async (cotUri) =>
                  resourceFromUrl(cotUri, {
                    noBusinessRules: true,
                  })?.fetch() as Promise<
                    SpecifyResource<CollectionObjectType> | undefined
                  >
              )
            )
          )
          .then((cots) => {
            const formattersMap = filterArray(cots).reduce((map, cot) => {
              const format =
                cot.get('catalogNumberFormatName') ??
                schema.catalogNumFormatName;
              const cotName = cot.get('name');

              if (!map.has(format)) {
                map.set(format, {
                  name: format,
                  title: format,
                  isDefault: format === schema.catalogNumFormatName,
                  cotNames: [],
                });
              }

              const formatter = map.get(format)!;
              map.set(format, {
                ...formatter,
                cotNames: [...formatter.cotNames, cotName],
              });
              return map;
            }, new Map<string, FormatterWithCOTs>());

            return Array.from(
              formattersMap.values(),
              ({ name, isDefault, cotNames }) => {
                const title = queryText.formatInputAs({
                  commaSeparatedFormats: cotNames.join(', '),
                });
                return {
                  name,
                  title,
                  isDefault,
                };
              }
            );
          }),
      []
    ),
    false
  );

  return (
    <FormatSelect
      availableFormatters={availableFormatters}
      currentFormat={formatter}
      showSingular={
        Object.values(schema.collectionObjectTypeCatalogNumberFormats).some(
          (format) => format !== null && format !== schema.catalogNumFormatName
        ) ||
        (formatter !== undefined &&
          !Object.values(schema.collectionObjectTypeCatalogNumberFormats)
            .filter((formatName) => formatName !== null)
            .includes(formatter))
      }
      onChange={handleChange}
    />
  );
}

function FormatSelect({
  availableFormatters,
  currentFormat,
  showSingular = false,
  onChange: handleChange,
}: {
  readonly availableFormatters: RA<SimpleFormatter> | undefined;
  readonly currentFormat: string | undefined;
  readonly showSingular?: boolean;
  readonly onChange: ((formatter: string | undefined) => void) | undefined;
}): JSX.Element | null {
  const [formatterSelectIsOpen, setFormatterSelect] = React.useState(false);

  const id = useId('formatters-selection');

  return availableFormatters === undefined ? (
    typeof currentFormat === 'string' ? (
      <>{commonText.loading()}</>
    ) : null
  ) : showSingular || availableFormatters.length > 1 ? (
    <>
      <Button.Small
        aria-controls={id('list')}
        aria-label={queryText.chooseFormatter()}
        className={`${
          availableFormatters.find(
            (selected) => selected.name === currentFormat
          )?.isDefault ||
          currentFormat === undefined ||
          currentFormat === ''
            ? 'bg-white dark:bg-neutral-600'
            : 'bg-yellow-250 dark:bg-yellow-900 '
        }`}
        title={queryText.chooseFormatter()}
        onClick={() => setFormatterSelect(!formatterSelectIsOpen)}
      >
        {icons.cog}
      </Button.Small>
      {formatterSelectIsOpen && (
        <div>
          <Select
            aria-label={queryText.chooseFormatter()}
            className={customSelectElementBackground}
            disabled={handleChange === undefined}
            id={id('list')}
            value={currentFormat}
            onValueChange={handleChange}
          >
            <option value="" />
            {availableFormatters.map((formatter, index) => (
              <option key={index} value={formatter.name}>
                {`${formatter.title}${formatter.isDefault ? resourcesText.defaultInline() : ''}`}
              </option>
            ))}
            {currentFormat !== undefined &&
            !availableFormatters
              .map(({ name }) => name)
              .includes(currentFormat) ? (
              <option key="invalidCOT" value={currentFormat}>
                {queryText.invalidPicklistValue({ value: currentFormat })}
              </option>
            ) : undefined}
          </Select>
        </div>
      )}
    </>
  ) : null;
}
