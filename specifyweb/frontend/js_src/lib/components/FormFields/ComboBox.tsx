/**
 * Specify form PickList
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import type { IR, RA, RR } from '../../utils/types';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema, TableFields } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { PickList, Tables } from '../DataModel/types';
import { PickListComboBox } from '../PickLists';
import { PickListTypes } from '../PickLists/definitions';
import { fetchPickList, getPickListItems } from '../PickLists/fetch';
import { FieldsPickList } from '../PickLists/FieldsPickList';
import { FormattersPickList } from '../PickLists/FormattersPickList';
import { TablesPickList } from '../PickLists/TablesPickList';
import { TreeLevelComboBox } from '../PickLists/TreeLevelPickList';

export type DefaultComboBoxProps = {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: LiteralField | Relationship;
  readonly pickListName: string;
  readonly defaultValue: string | undefined;
  readonly isRequired: boolean;
  readonly isDisabled: boolean;
};

export type PickListItemSimple = {
  readonly value: string;
  readonly title: string;
};

export const specialPickLists = {
  _treeLevelComboBox: TreeLevelComboBox,
  _fieldsPickList: FieldsPickList,
  _formattersPickList: FormattersPickList,
  _tableNamePickList: TablesPickList,
} as const;

export const specialPickListMapping: RR<
  '',
  IR<keyof typeof specialPickLists>
> & {
  readonly [TABLE_NAME in keyof Tables]?: Partial<
    RR<TableFields<Tables[TABLE_NAME]>, keyof typeof specialPickLists>
  >;
} = {
  '': {
    definitionItem: '_treeLevelComboBox',
  },
  PickList: {
    fieldName: '_fieldsPickList',
    formatter: '_formattersPickList',
    tableName: '_tableNamePickList',
  },
};

export function Combobox(props: DefaultComboBoxProps): JSX.Element | null {
  const Component =
    specialPickLists[props.pickListName as keyof typeof specialPickLists] ??
    DefaultComboBox;
  return <Component {...props} />;
}

function DefaultComboBox(props: DefaultComboBoxProps): JSX.Element | null {
  const [pickList] = useAsyncState<SpecifyResource<PickList> | false>(
    React.useCallback(
      async () =>
        typeof props.pickListName === 'string'
          ? fetchPickList(props.pickListName).then((pickList) => {
              if (pickList === undefined) {
                console.error('Unable to find pick list', props);
                return false;
              } else return pickList;
            })
          : undefined,
      [props.pickListName]
    ),
    false
  );

  const [items, setItems] = useLiveState<RA<PickListItemSimple> | undefined>(
    React.useCallback(
      () =>
        typeof pickList === 'object' ? getPickListItems(pickList) : undefined,
      [pickList]
    )
  );

  /*
   * TEST: test if can add items to PickListTypes.FIELD
   * FEATURE: make other pick list types editable
   */
  const isReadOnly = React.useContext(ReadOnlyContext);
  const canAdd =
    !isReadOnly &&
    // Only PickListTypes.ITEMS pick lists are editable
    pickList !== false &&
    pickList?.get('type') === PickListTypes.ITEMS;

  return typeof pickList === 'object' && Array.isArray(items) ? (
    <PickListComboBox
      {...props}
      items={items}
      pickList={pickList}
      onAdd={
        canAdd
          ? (value): void =>
              setItems([
                ...items,
                {
                  title: value,
                  value,
                },
              ])
          : undefined
      }
    />
  ) : (
    <Input.Text
      disabled
      required={props.isRequired}
      // BUG: required has no effect while disabled. Need a better solution
      value={pickList === false ? '' : commonText.loading()}
    />
  );
}
