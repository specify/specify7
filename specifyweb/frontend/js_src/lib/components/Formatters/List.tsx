import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, IR, RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { ErrorMessage, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import { ForwardOutlet } from '../Router/RouterUtils';
import type { Aggregator, Formatter } from './spec';
import type { FormatterTypesOutlet } from './Types';

export function FormatterList(): JSX.Element {
  const { type, tableName } = useParams();
  const { items } = useOutletContext<FormatterTypesOutlet>();

  return (
    <XmlEntryList
      getNewItem={(currentItems, table): Aggregator | Formatter => {
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
        const common = {
          name: newName,
          title: newTitle,
          table,
          isDefault: currentItems.length === 0,
        } as const;
        return type === 'formatter'
          ? ensure<Formatter>()({
              ...common,
              definition: {
                isSingle: true,
                conditionField: undefined,
                external: undefined,
                fields: [],
              },
            })
          : ensure<Aggregator>()({
              ...common,
              separator: ', ',
              suffix: '',
              limit: undefined,
              formatter: undefined,
              sortField: undefined,
            });
      }}
      header={
        type === 'formatter'
          ? resourcesText.availableFormatters()
          : resourcesText.availableAggregators()
      }
      items={items}
      tableName={tableName}
    />
  );
}

export function XmlEntryList<
  ITEM extends {
    readonly table: SpecifyTable | undefined;
    readonly name: string;
  }
>({
  items: [items, setItems],
  tableName,
  header,
  getNewItem,
}: {
  readonly items: GetSet<RA<ITEM>>;
  readonly tableName: string | undefined;
  readonly header: string;
  readonly getNewItem: (currentItems: RA<ITEM>, table: SpecifyTable) => ITEM;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();

  if (tableName === undefined) return <NotFoundView container={false} />;
  const table = strictGetTable(tableName);
  const currentItems = items.filter((item) => item.table === table);
  const uniqueNames = f.unique(currentItems.map(({ name }) => name));
  const hasDuplicates = uniqueNames.length !== currentItems.length;

  /** Get an item without throwing of TypeScript */
  const read = <TYPE,>(item: ITEM, key: string): TYPE | undefined =>
    (item as IR<TYPE | undefined>)[key];

  const hasDefault = currentItems.some(
    (item) => read<boolean>(item, 'isDefault') === true
  );
  return (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4 className="text-xl">{table.label}</h4>
      <h5>{`${header}:`}</h5>
      <Ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item, index) =>
          item.table === table ? (
            <li key={index}>
              <Link.Default href={getLink(index)}>
                {`${read<string>(item, 'title') ?? item.name} ${
                  read<boolean>(item, 'isDefault') === true
                    ? `(${resourcesText.default()})`
                    : ''
                }`}
              </Link.Default>
            </li>
          ) : undefined
        )}
      </Ul>
      {currentItems.length > 0 && !hasDefault ? (
        <ErrorMessage>{resourcesText.selectDefaultFormatter()}</ErrorMessage>
      ) : undefined}
      {hasDuplicates && (
        <ErrorMessage>{resourcesText.duplicateFormatters()}</ErrorMessage>
      )}
      {!isReadOnly && (
        <div>
          <Button.Green
            onClick={(): void => {
              const newItem = getNewItem(currentItems, table);
              setItems([...items, newItem]);
              navigate(getLink(items.length));
            }}
          >
            {commonText.add()}
          </Button.Green>
        </div>
      )}
      <ForwardOutlet />
    </div>
  );
}

const getLink = (index: number): string => resolveRelative(`./${index}`);
