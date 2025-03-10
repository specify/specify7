import { R, RA } from "../../utils/types";
import { MappingPath } from "../WbPlanView/Mapper"
import { getNumberFromToManyIndex, valueIsToManyIndex, valueIsTreeRank } from "../WbPlanView/mappingHelpers"

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


export const isBatchEditNullRecord = (batchEditPack: BatchEditPack | undefined, mappingPath: MappingPath): boolean => {
    if (batchEditPack == undefined) return false;
    if (mappingPath.length <= 1) return batchEditPack?.self?.id === BATCH_EDIT_NULL_RECORD;
    const [node, ...rest] = mappingPath;
    // FEAT: Remove this
    if (valueIsTreeRank(node)) return false;
    
    // it may actually not be a to-many
    const isToMany = rest[0] !== undefined && valueIsToManyIndex(rest[0]);

    // batch-edit pack is strictly lower-case
    const lookUpNode = node.toLowerCase();
    if (isToMany){
        // id starts with 1...
        const toManyId = getNumberFromToManyIndex(rest[0]) - 1;
        const toMany = batchEditPack?.to_many?.[lookUpNode]?.[toManyId];
        return isBatchEditNullRecord(toMany, rest.slice(1));
    }
    return isBatchEditNullRecord(batchEditPack?.to_one?.[lookUpNode], rest);
}