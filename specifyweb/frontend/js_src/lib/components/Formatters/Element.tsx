import React from 'react';
import { useOutletContext } from 'react-router';
import { useParams } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import type { GetSet } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/Router';
import { FormattersContext } from './index';
import type { Aggregator, Formatter } from './spec';
import type { FormatterTypesOutlet } from './Types';
import { AggregatorElement } from './Aggregator';
import { FormatterElement } from './Formatter';

export function FormatterWrapper(): JSX.Element {
  // FIXME: add delete button
  const { type, name } = useParams();
  // FIXME: add save button
  const {
    items: [items, setItems],
  } = useOutletContext<FormatterTypesOutlet>();
  const index = items.findIndex((item) => item.name === name);
  const item = items[index];
  const setItem = (newItem: Aggregator | Formatter): void =>
    setItems(replaceItem(items, index, newItem));
  const getSet = [item, setItem] as const;

  const context = React.useContext(FormattersContext)!;
  const isReadOnly = context.isReadOnly;
  return index === -1 ? (
    <NotFoundView container={false} />
  ) : (
    <div className="flex flex-col gap-2 overflow-auto">
      <h4 className="text-xl">{item.title}</h4>
      <Link.Default href={resolveRelative('../../')}>
        {icons.arrowLeft}
        {type === 'formatter'
          ? resourcesText.formatters()
          : resourcesText.aggregators()}
      </Link.Default>
      <Label.Block>
        {resourcesText.name()}
        <Input.Text
          isReadOnly={isReadOnly}
          required
          value={getSet[0].name}
          onValueChange={(name): void => setItem({ ...item, name })}
        />
      </Label.Block>
      <Label.Block>
        {resourcesText.title()}
        <Input.Text
          isReadOnly={isReadOnly}
          value={getSet[0].title}
          onValueChange={(name): void => setItem({ ...item, name })}
        />
      </Label.Block>
      <Label.Inline>
        <Input.Checkbox
          checked={getSet[0].isDefault}
          isReadOnly={isReadOnly}
          onClick={(): void =>
            setItems(
              // Ensure there is only one default
              items.map((otherItem, itemIndex) =>
                otherItem.table === item.table
                  ? itemIndex === index
                    ? { ...item, isDefault: !item.isDefault }
                    : { ...otherItem, isDefault: false }
                  : otherItem
              )
            )
          }
        />
        {resourcesText.default()}
      </Label.Inline>
      {type === 'formatter' ? (
        <FormatterElement
          isReadOnly={isReadOnly}
          item={getSet as GetSet<Formatter>}
        />
      ) : (
        <AggregatorElement
          isReadOnly={isReadOnly}
          item={getSet as GetSet<Aggregator>}
        />
      )}
    </div>
  );
}
