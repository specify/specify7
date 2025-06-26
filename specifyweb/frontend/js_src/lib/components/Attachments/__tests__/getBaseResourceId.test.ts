import { requireContext } from "../../../tests/helpers";
import { getResourceApiUrl } from "../../DataModel/resource";
import { tables } from "../../DataModel/tables";
import { getBaseResourceId } from "../Cell";

requireContext();

describe("getBaseResourceId", ()=>{

    test("gets id", ()=>{

        const collectionObjectId = 9;

        const collectionObjectAttachment = new tables.CollectionObjectAttachment.Resource({
            id: 5,
            collectionObject: getResourceApiUrl("CollectionObject", collectionObjectId)
        });

        expect(getBaseResourceId(tables.CollectionObject, collectionObjectAttachment)).toBe(collectionObjectId);

    });
});