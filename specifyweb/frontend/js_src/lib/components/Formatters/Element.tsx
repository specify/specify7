import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { resourcesText } from '../../localization/resources';
import type { GetSet } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/Router';
import { AggregatorElement } from './Aggregator';
import { FormatterElement } from './Formatter';
import type { Aggregator, Formatter } from './spec';
import type { FormatterTypesOutlet } from './Types';

// FIXME: allow opening this in the schema editor
export function FormatterWrapper(): JSX.Element {
  const { type, name } = useParams();
  const {
    items: [items, setItems],
  } = useOutletContext<FormatterTypesOutlet>();
  const index = items.findIndex((item) => item.name === name);
  const item = items[index];
  const setItem = (newItem: Aggregator | Formatter): void =>
    setItems(replaceItem(items, index, newItem));
  const getSet = [item, setItem] as const;

  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();
  const handleClose = (): void => navigate(resolveRelative('../../'));
  return index === -1 ? (
    <Dialog
      buttons={commonText.close()}
      header={mainText.pageNotFound()}
      onClose={handleClose}
    >
      <NotFoundView container={false} />
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          <Button.Red
            onClick={(): void => {
              setItems(removeItem(items, index));
              handleClose();
            }}
          >
            {commonText.delete()}
          </Button.Red>
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={commonText.colonLine({
        label:
          type === 'formatter'
            ? resourcesText.formatter()
            : resourcesText.aggregator(),
        value: item.title ?? item.name,
      })}
      onClose={handleClose}
    >
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
        <FormatterElement item={getSet as GetSet<Formatter>} />
      ) : (
        <AggregatorElement item={getSet as GetSet<Aggregator>} />
      )}
    </Dialog>
  );
}
