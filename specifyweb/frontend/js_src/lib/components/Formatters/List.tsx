import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { ensure } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { strictGetModel } from '../DataModel/schema';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/Router';
import { ForwardOutlet } from '../Router/RouterUtils';
import type { Aggregator, Formatter } from './spec';
import type { FormatterTypesOutlet } from './Types';

const getLink = (name: string): string =>
  resolveRelative(`./name/${encodeURIComponent(name)}`);

export function FormatterList(): JSX.Element {
  const { type, tableName } = useParams();
  const {
    items: [items, setItems],
  } = useOutletContext<FormatterTypesOutlet>();
  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();
  if (tableName === undefined) return <NotFoundView container={false} />;
  const table = strictGetModel(tableName);
  return (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4 className="text-xl">{table.label}</h4>
      <h5>{`${
        type === 'formatter'
          ? resourcesText.availableFormatters()
          : resourcesText.availableAggregators()
      }:`}</h5>
      <Ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item, index) =>
          item.table === table ? (
            <li key={index}>
              <Link.Default href={getLink(item.name)}>
                {`${item.title ?? item.name} ${
                  item.isDefault ? `(${resourcesText.default()})` : ''
                }`}
              </Link.Default>
            </li>
          ) : undefined
        )}
      </Ul>
      {!isReadOnly && (
        <div>
          <Button.Green
            onClick={(): void => {
              const currentItems = items.filter((item) => item.table === table);
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
              const hasDefault = currentItems.some(
                ({ isDefault }) => isDefault
              );
              const common = {
                name: newName,
                title: newTitle,
                table,
                isDefault: !hasDefault,
              } as const;
              const newItem =
                type === 'formatter'
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
              setItems([...items, newItem]);
              navigate(getLink(newName));
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
