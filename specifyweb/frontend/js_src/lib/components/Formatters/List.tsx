import React from 'react';
import { useOutletContext } from 'react-router';
import { FormatterTypesOutlet } from './Types';
import { strictGetModel } from '../DataModel/schema';
import { Ul } from '../Atoms';
import { NotFoundView } from '../Router/NotFoundView';
import { Link } from '../Atoms/Link';
import { resourcesText } from '../../localization/resources';
import { resolveRelative } from '../Router/Router';
import { useParams } from 'react-router-dom';

export function FormatterList(): JSX.Element {
  const { type, tableName } = useParams();
  const {
    items: [items],
  } = useOutletContext<FormatterTypesOutlet>();
  if (tableName === undefined) return <NotFoundView container={false} />;
  const table = strictGetModel(tableName);
  // FIXME: add "Add" button
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
              <Link.Default
                href={resolveRelative(
                  `./name/${encodeURIComponent(item.name)}`
                )}
              >
                {`${item.title ?? item.name} ${
                  item.isDefault ? `(${resourcesText.default()})` : ''
                }`}
              </Link.Default>
            </li>
          ) : undefined
        )}
      </Ul>
    </div>
  );
}
