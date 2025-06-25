import { overrideAjax } from "../../../tests/ajax";
import attachmentSettings from "../../../tests/ajax/static/context/attachment_settings.json"
import { requireContext } from "../../../tests/helpers";
import { serializeResource } from "../../DataModel/serializers";
import { tables } from "../../DataModel/tables";
import { formatUrl } from "../../Router/queryString";
import { fetchOriginalUrl, overrideAttachmentSettings } from "../attachments";


requireContext();

describe("fetchOriginalUrl", ()=>{

    const attachmentLocation = "testLocation";

    const mimeType = 'image/jpeg';
    const fileName = 'testFile.jpg';
    const testToken = "testToken";

    test("url when token not required for get", async ()=>{

        expect(attachmentSettings.token_required_for_get).toBe(false);

        const attachment = new tables.Attachment.Resource({
            attachmentlocation: attachmentLocation,
            mimetype: mimeType,
            origfilename: "C:\\testSlash.jpg",
            title: fileName,
            isPublic: true
        });

        const url = await fetchOriginalUrl(serializeResource(attachment));

        expect(url).toBe("http://host.docker.internal/fileget?coll=KU+Fish+Voucher+Collection&type=O&filename=testLocation&downloadname=testSlash.jpg");

    });

    overrideAjax(
        formatUrl('/attachment_gw/get_token/', { filename: attachmentLocation }), 
        testToken
    );

    test("url when token is required for get", async ()=>{

        overrideAttachmentSettings({...attachmentSettings, token_required_for_get: true});

        const attachment = new tables.Attachment.Resource({
            attachmentlocation: attachmentLocation,
            mimetype: mimeType,
            origfilename: "C:\\testSlash.jpg",
            title: fileName,
            isPublic: true
        });

        const url = await fetchOriginalUrl(serializeResource(attachment));

        expect(url).toBe("http://host.docker.internal/fileget?coll=KU+Fish+Voucher+Collection&type=O&filename=testLocation&downloadname=testSlash.jpg&token=testToken");
    });

});
