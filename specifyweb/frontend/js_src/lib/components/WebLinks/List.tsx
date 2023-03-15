import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { TableIcon } from '../Molecules/TableIcon';
import { resolveRelative } from '../Router/Router';
import type { WebLinkOutlet } from './Editor';

export function WebLinkList(): JSX.Element {
  const {
    items: [items, setItems],
  } = useOutletContext<WebLinkOutlet>();
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
              {item.name}
            </Link.Default>
          </li>
        ))}
      </Ul>
      <div>
        <Button.Green
          onClick={(): void => {
            const newItem = {
              name: '',
              table: undefined,
              description: '',
              parts: [],
              usages: [],
            };
            // FIXME: integrate web link editor into schema config
            setItems([...items, newItem]);
            navigate(getLink(items.length));
          }}
        >
          {commonText.add()}
        </Button.Green>
      </div>
    </div>
  );
}

const getLink = (index: number): string => resolveRelative(`./${index}`);
