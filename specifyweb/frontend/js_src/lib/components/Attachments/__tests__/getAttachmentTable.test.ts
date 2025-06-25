import { requireContext } from "../../../tests/helpers";
import { tables } from "../../DataModel/tables";
import { getAttachmentTable } from "../Cell";

requireContext();

describe("getAttachmentTable", ()=>{

    test.skip("attachment table", ()=>{
        expect(getAttachmentTable(tables.Accession.tableId)).toBe(tables.Accession);
    });

    test.skip("non-attachment table", ()=>{
        expect(getAttachmentTable(tables.Division.tableId)).toBeUndefined();
    });

});