import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import type { GetSet, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { TableIcon } from '../Molecules/TableIcon';
import { resolveRelative } from '../Router/queryString';
import type { WebLink } from './spec';

export function WebLinkList({
  items: [items, setItems],
}: {
  readonly items: GetSet<RA<WebLink>>;
}): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4 className="text-xl">{resourcesText.availableWebLink()}</h4>
      <Ul className="grid grid-cols-[auto_1fr] gap-1 overflow-y-auto">
        {items.map((item, index) => (
          <li className="contents" key={index}>
            <Link.Default className="contents" href={getLink(index)}>
              {typeof item.table === 'object' ? (
                <TableIcon label={false} name={item.table.name} />
              ) : (
                <span />
              )}
              <span>{item.name}</span>
            </Link.Default>
          </li>
        ))}
      </Ul>
      <div>
        <Button.Success
          onClick={(): void => {
            const newItem = {
              name: localized(''),
              table: undefined,
              description: localized(''),
              parts: [],
              usages: [],
            };
            setItems([...items, newItem]);
            navigate(getLink(items.length));
          }}
        >
          {commonText.add()}
        </Button.Success>
      </div>
    </div>
  );
}

const getLink = (index: number): string => resolveRelative(`./${index}`);
