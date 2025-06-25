import { overrideAjax } from "../../../tests/ajax";
import { formatUrl } from "../../Router/queryString";
import attachmentSettings from "../../../tests/ajax/static/context/attachment_settings.json"
import { fetchToken, overrideAttachmentSettings } from "../attachments";


describe("fetchToken", ()=>{

    const testToken = "testToken";

    const fileName = "testFileName";

    overrideAjax(
        formatUrl('/attachment_gw/get_token/', { fileName }), 
        testToken
    );

    test("does not fetch token when not required for get", ()=>{

        expect(attachmentSettings.token_required_for_get).toBe(false);

        expect(fetchToken(fileName)).resolves.toBe(undefined);

    });

    test("does not fetch token when not required for get", ()=>{

        overrideAttachmentSettings({...attachmentSettings, token_required_for_get: true});

        expect(fetchToken(fileName)).resolves.toBe(testToken);

    });

    
})