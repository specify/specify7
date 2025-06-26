import { renderHook, waitFor } from "@testing-library/react";
import { useAttachment } from "../Plugin";
import { requireContext } from "../../../tests/helpers";
import { tables } from "../../DataModel/tables";
import { getResourceApiUrl } from "../../DataModel/resource";
import { overrideAjax } from "../../../tests/ajax";
import { SpecifyResource } from "../../DataModel/legacyTypes";
import { AnySchema } from "../../DataModel/helperTypes";


requireContext();

describe("useAttachment", ()=>{

    test("resource is undefined", async ()=>{

        const {result} = renderHook(()=>useAttachment(undefined));

        await waitFor(()=>{
            expect(result.current[0]).toBe(false);
        });

    });

    test("resource is Attachment", async ()=>{

        const attachment = new tables.Attachment.Resource({id: 10, attachmentlocation: "testLocation"});

        const { result } = renderHook(()=>useAttachment(attachment));

        await waitFor(()=>{
            expect(result.current[0]).toBe(attachment);
        });

    });

    const collectionObjectAttachmentId = 9;
    const attachmentId = 10;
    const collectionObjectId = 3;

    const collectionObjectAttachment = {
        id: collectionObjectAttachmentId,
        attachment: {
            id: attachmentId,
            resource_uri: getResourceApiUrl('Attachment', attachmentId),
            attachmentlocation: "testLocation",
            _tableName: 'Attachment',
        },
        collectionobject: getResourceApiUrl("CollectionObject", collectionObjectId),
        _tableName: 'CollectionObjectAttachment',
    };

    overrideAjax(getResourceApiUrl("CollectionObjectAttachment", collectionObjectAttachmentId), collectionObjectAttachment);

    test("resource is Collection Object Attachment", async ()=>{

        const collectionObjectAttachment = new tables.CollectionObjectAttachment.Resource({id: collectionObjectAttachmentId});

        const { result } = renderHook(()=>useAttachment(collectionObjectAttachment));

        await waitFor(()=>{
            const resource = result.current[0] as SpecifyResource<AnySchema>;
            expect(typeof resource).toBe('object');
            expect(resource.specifyTable.name).toBe("Attachment");
        });
        
    });

});