import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import { AggregatorElement } from './Aggregator';
import { FormatterElement } from './Formatter';
import type { Aggregator, Formatter } from './spec';
import type { FormatterTypesOutlet } from './Types';

/**
 * Display a dialog for editing
 * weblink/field formatter/formatter/aggregator and calls a render prop to
 * render the actual interface
 */
export function XmlEditorShell<
  ITEM extends { readonly name: string },
  OUTLET_CONTEXT extends { readonly items: GetSet<RA<ITEM>> },
>({
  header,
  children,
}: {
  readonly header: LocalizedString;
  readonly children: (props: XmlEditorShellSlotProps<ITEM>) => JSX.Element;
}): JSX.Element {
  const { index: rawIndex } = useParams();
  const { items: allItems } = useOutletContext<OUTLET_CONTEXT>();
  const [items, setItems] = allItems;
  const index = f.parseInt(rawIndex)!;
  const item = items[index];
  const uniqueNames = f.unique(items.map(({ name }) => name));
  const hasDuplicates = uniqueNames.length !== items.length;
  const { validationRef } = useValidation(
    hasDuplicates ? resourcesText.duplicateFormatters() : ''
  );

  const setItem = (newItem: ITEM): void =>
    setItems(replaceItem(items, index, newItem));
  const getSet = [item, setItem] as const;

  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();
  const handleClose = (): void => navigate(resolveRelative('../'));

  const id = useId('item');
  return item === undefined ? (
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
          {isReadOnly ? undefined : (
            <Button.Danger
              onClick={(): void => {
                setItems(removeItem(items, index));
                handleClose();
              }}
            >
              {commonText.delete()}
            </Button.Danger>
          )}
          <span className="-ml-2 flex-1" />
          <Submit.Secondary form={id('form')}>
            {commonText.close()}
          </Submit.Secondary>
        </>
      }
      header={commonText.colonLine({
        label: header,
        value:
          (item as unknown as { readonly title: string | undefined }).title ??
          item.name,
      })}
      icon={icons.variable}
      onClose={undefined}
    >
      <Form id={id('form')} onSubmit={handleClose}>
        <Label.Block>
          {resourcesText.name()}
          <Input.Text
            forwardRef={validationRef}
            isReadOnly={isReadOnly}
            required
            value={item.name}
            onValueChange={(name): void => setItem({ ...item, name })}
          />
        </Label.Block>
        {children({
          items: allItems,
          item: getSet,
        })}
      </Form>
    </Dialog>
  );
}

type XmlEditorShellSlotProps<ITEM extends { readonly name: string }> = {
  readonly items: GetSet<RA<ITEM>>;
  readonly item: GetSet<ITEM>;
};

export function FormatterWrapper(): JSX.Element {
  const { type, index } = useParams();
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <XmlEditorShell<Aggregator | Formatter, FormatterTypesOutlet>
      header={
        type === 'formatter'
          ? resourcesText.formatter()
          : resourcesText.aggregator()
      }
    >
      {makeXmlEditorShellSlot<Aggregator | Formatter>(
        (getSet) =>
          type === 'formatter' ? (
            <FormatterElement item={getSet as GetSet<Formatter>} />
          ) : (
            <AggregatorElement item={getSet as GetSet<Aggregator>} />
          ),
        index,
        isReadOnly
      )}
    </XmlEditorShell>
  );
}

export const makeXmlEditorShellSlot = <
  ITEM extends {
    readonly name: string;
    readonly title: string | undefined;
    readonly isDefault: boolean;
    readonly table: SpecifyTable | undefined;
  }
>(
  children: (getSet: GetSet<ITEM>) => JSX.Element,
  index: string | undefined,
  isReadOnly: boolean
) =>
  function XmlEditorShellSlot({
    item: getSet,
    items: [items, setItems],
  }: XmlEditorShellSlotProps<ITEM>): JSX.Element {
    return (
      <>
        <Label.Block>
          {resourcesText.title()}
          <Input.Text
            isReadOnly={isReadOnly}
            value={getSet[0].title}
            onValueChange={(title): void => getSet[1]({ ...getSet[0], title })}
          />
        </Label.Block>
        <Label.Inline>
          <Input.Checkbox
            checked={getSet[0].isDefault}
            isReadOnly={isReadOnly}
            onChange={(): void =>
              setItems(
                // Ensure there is only one default
                items.map((otherItem, itemIndex) =>
                  otherItem.table === getSet[0].table
                    ? itemIndex.toString() === index
                      ? { ...getSet[0], isDefault: !getSet[0].isDefault }
                      : { ...otherItem, isDefault: false }
                    : otherItem
                )
              )
            }
          />
          {resourcesText.default()}
        </Label.Inline>
        {children(getSet)}
      </>
    );
  };
