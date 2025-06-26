import { requireContext } from "../../../tests/helpers";
import { serializeResource } from "../../DataModel/serializers";
import { tables } from "../../DataModel/tables";
import { formatAttachmentUrl  } from "../attachments";

requireContext();

describe("formatAttachmentUrl", ()=>{

    test("url construction", ()=>{
        
        const attachmentLocation = "testLocation";

        const thumbnailMimeType = 'image/jpeg';
        const thumbnailFileName = 'testFile.jpg';

        const attachment = new tables.Attachment.Resource({
            attachmentlocation: attachmentLocation,
            mimetype: thumbnailMimeType,
            origfilename: thumbnailFileName,
            title: thumbnailFileName,
            isPublic: true
        });

        const url = formatAttachmentUrl(serializeResource(attachment), "testToken");

        expect(url).toBe("http://host.docker.internal/fileget?coll=KU+Fish+Voucher+Collection&type=O&filename=testLocation&downloadname=testFile.jpg&token=testToken")
    });
});