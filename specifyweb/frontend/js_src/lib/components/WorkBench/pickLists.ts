import type { RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { fetchPickList, getPickListItems } from '../PickLists/fetch';
import type { SplitMappingPath } from '../WbPlanView/mappingHelpers';

export type WbPickLists = RR<
  number,
  {
    readonly readOnly: boolean;
    readonly items: RA<string>;
  }
>;

export const fetchWbPickLists = async (
  columns: RA<string>,
  tableNames: RA<keyof Tables>,
  lines: RA<SplitMappingPath>
): Promise<WbPickLists> =>
  Promise.all(
    tableNames
      .map((tableName, index) => ({
        tableName,
        fieldName: lines[index].mappingPath.at(-1)!,
        headerName: lines[index].headerName,
      }))
      .map(async ({ tableName, fieldName, headerName }) => {
        const pickList = getTable(tableName)
          ?.getField(fieldName)
          ?.getPickList();
        const definition =
          typeof pickList === 'string'
            ? await fetchPickList(pickList)
            : undefined;
        if (definition === undefined) return undefined;
        return {
          physicalCol: columns.indexOf(headerName),
          pickList: {
            readOnly: definition.get('readOnly'),
            items: getPickListItems(definition).map(({ title }) => title),
          },
        };
      })
  ).then((items) => Object.fromEntries(filterArray(items).map(Object.values)));
