import { overrideAjax } from "../../../tests/ajax";
import { Http } from "../../../utils/ajax/definitions";
import { formatUrl } from "../../Router/queryString";
import { fetchAssetToken } from "../attachments";

describe("fetchAssetToken", ()=>{

    const testToken = "testToken";

    const fileName = "testFileName";
    const failedFileName = "failedTestFileName";

    overrideAjax(
        formatUrl('/attachment_gw/get_token/', { fileName }), 
        testToken
    );

    test("fetches correctly, not silent", async ()=>{
        expect(fetchAssetToken(fileName)).resolves.toBe(testToken);
    });

    overrideAjax(
        formatUrl('/attachment_gw/get_token/', { fileName: failedFileName }), 
        testToken,
        {responseCode: Http.BAD_GATEWAY}
    );

    test("handles fetch error on silent", async ()=>{
        expect(fetchAssetToken(failedFileName, true)).resolves.toBe(undefined);
    });

});