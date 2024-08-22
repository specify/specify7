import { defined, R, RA } from "../../utils/types"
import { SpecifyTable } from "../DataModel/specifyTable"
import { isTreeTable } from "../InitialContext/treeRanks"
import { MappingPath } from "../WbPlanView/Mapper"
import { getNumberFromToManyIndex, relationshipIsToMany } from "../WbPlanView/mappingHelpers"

export const BATCH_EDIT_NULL_RECORD = "null_record";

// The key in the last column
export const BATCH_EDIT_KEY =  "batch_edit"

type BatchEditRecord = {
    readonly id: typeof BATCH_EDIT_NULL_RECORD | number | undefined,
    readonly ordernumber: number | undefined,
    readonly version: number | undefined
}

export type BatchEditPack = {
    readonly self?: BatchEditRecord,
    readonly to_one?: R<BatchEditPack>,
    readonly to_many?: R<RA<BatchEditPack>>
}


export const isBatchEditNullRecord = (batchEditPack: BatchEditPack | undefined, currentTable: SpecifyTable, mappingPath: MappingPath): boolean => {
    if (batchEditPack == undefined) return false;
    if (mappingPath.length <= 1) return batchEditPack?.self?.id === BATCH_EDIT_NULL_RECORD;
    const [node, ...rest] = mappingPath;
    if (isTreeTable(currentTable.name)) return false;
    const relationship = defined(currentTable.getRelationship(node));
    const relatedTable = relationship.relatedTable;
    const name = node.toLowerCase();
    if (relationshipIsToMany(relationship)){
        // id starts with 1...
        const toManyId = getNumberFromToManyIndex(rest[0]) - 1;
        const toMany = batchEditPack?.to_many?.[name][toManyId];
        return toMany !== undefined && isBatchEditNullRecord(toMany, relatedTable, rest.slice(1));
    }
    return isBatchEditNullRecord(batchEditPack?.to_one?.[name], relatedTable, rest);
}