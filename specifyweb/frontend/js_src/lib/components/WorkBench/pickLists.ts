import { getTable } from '../DataModel/tables';
import { fetchPickList } from '../PickLists/fetch';
import { serializeResource } from '../DataModel/serializers';
import { filterArray, RA, RR } from '../../utils/types';
import { SplitMappingPath } from '../WbPlanView/mappingHelpers';
import { Tables } from '../DataModel/types';

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
        const serialized = serializeResource(definition);
        return {
          physicalCol: columns.indexOf(headerName),
          pickList: {
            readOnly: serialized.readOnly,
            items: serialized.pickListItems.map(({ title }) => title),
          },
        };
      })
  ).then((items) => Object.fromEntries(filterArray(items).map(Object.values)));
