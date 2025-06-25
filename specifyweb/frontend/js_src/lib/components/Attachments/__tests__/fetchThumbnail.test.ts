import attachmentSettings from "../../../tests/ajax/static/context/attachment_settings.json"
import { requireContext } from "../../../tests/helpers";
import { serializeResource } from "../../DataModel/serializers";
import { tables } from "../../DataModel/tables";
import { formatUrl } from "../../Router/queryString";
import { fetchThumbnail } from "../attachments";

requireContext();

describe("fetchThumbnail", ()=>{

    const attachmentLocation = "testLocation";

    const thumbnailMimeType = 'image/jpeg';
    const thumbnailFileName = 'testFile.jpg';


    test("handles thumbnailable types", async ()=>{
        const attachment = new tables.Attachment.Resource({
            attachmentlocation: attachmentLocation,
            mimetype: thumbnailMimeType,
            origfilename: thumbnailFileName,
            title: thumbnailFileName,
            isPublic: true
        });

        const thumbnail = await fetchThumbnail(serializeResource(attachment), 78);

        const expectedSource = formatUrl(attachmentSettings.read, {
              coll: attachmentSettings.collection,
              type: 'T',
              fileName: attachment.get("attachmentLocation"),
              scale: 78,
              token: undefined,
            });

        expect(thumbnail).toEqual({
                src: expectedSource,
                alt: 'testLocation',
                width: 78,
                height: 78
            });
    });

    const mimeType = "text/plain";
    const fileName = "testFile.txt";

    test("handles thumbnailable types", async ()=>{

        const attachment = new tables.Attachment.Resource({
            attachmentlocation: attachmentLocation,
            mimetype: mimeType,
            origfilename: fileName,
            title: fileName,
            isPublic: true
        });

        const thumbnail = await fetchThumbnail(serializeResource(attachment), 78);

        expect(thumbnail).toEqual({ alt: 'text', src: 'test-file-stub', width: 78, height: 78 });

    });

    test("handles no attachmentlocation case", async ()=>{

        const attachment = new tables.Attachment.Resource({
            attachmentlocation: null,
            mimetype: thumbnailMimeType,
            origfilename: thumbnailFileName,
            title: thumbnailFileName,
            isPublic: true
        });

        const thumbnail = await fetchThumbnail(serializeResource(attachment), 78);

        expect(thumbnail).toBeUndefined();
    });

});