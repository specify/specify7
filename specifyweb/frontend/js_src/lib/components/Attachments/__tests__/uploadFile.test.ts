import { overrideAjax } from "../../../tests/ajax";
import { requireContext } from "../../../tests/helpers";
import { Http } from "../../../utils/ajax/definitions";
import { uploadFile } from "../attachments";

import attachmentSettings from "../../../tests/ajax/static/context/attachment_settings.json"

requireContext();

describe("uploadFile", ()=>{

    const xhrMock = {
        open: jest.fn(),
        send: jest.fn(),
        // Immediately call the callback
        addEventListener,
        readyState: 4,
        status: Http.OK as number, // Need to loosen up the type.
        _error: undefined as unknown
    }

    // Functions get hoisted
    function addEventListener(_: string, callback: ()=>void){
        try{
            callback()
        } catch (error){
            console.log("got here!");
            xhrMock._error = error;
        }
    }

    let previousImplementation: typeof window.XMLHttpRequest;
    let previousTelemetry: typeof globalThis.performance.getEntries;

    beforeEach(()=>{

        previousImplementation = window.XMLHttpRequest;
        previousTelemetry = globalThis.performance.getEntries;

        xhrMock.open.mockClear();
        xhrMock.send.mockClear();
        // This is done like this so that a test can alter the return code
        // to test errors.
        xhrMock.status = Http.OK;
        xhrMock._error = undefined;
        
        // @ts-expect-error
        window.XMLHttpRequest = jest.fn(()=>xhrMock);
        globalThis.performance.getEntries = ()=>[]
    });

    afterEach(()=>{
        window.XMLHttpRequest = previousImplementation;
        globalThis.performance.getEntries = previousTelemetry;
    });


    const testFileName = "textFile.txt";
    const testToken = "testToken";
    const testAttachmentLocation = "testLocation";
    const testFile = new File(["Some Text Contents"], testFileName, {type: "text/plain"});

    overrideAjax(
        `/attachment_gw/get_upload_params/`, 
        [{token: testToken, attachmentLocation: testAttachmentLocation}],
        {method: "POST"}
    )

    test("sends request correctly", async ()=>{

        const onProgress = jest.fn();

        const attachment = await uploadFile(
            testFile, 
            onProgress
        );

        expect(xhrMock.open).toBeCalledTimes(1);
        expect(xhrMock.open).toHaveBeenLastCalledWith('POST', attachmentSettings.write);
        
        expect(xhrMock.send).toBeCalledTimes(1);
        const formData: FormData = xhrMock.send.mock.calls.at(-1)[0];
        
        expect(formData.get('token')).toBe(testToken);
        expect(formData.get("store")).toBe(testAttachmentLocation);
        expect(formData.get("type")).toBe("O");
        expect(formData.get("coll")).toBe(attachmentSettings.collection);
        expect(formData.get("file")).toBe(testFile);

        expect(attachment?.get("attachmentLocation")).toBe(testAttachmentLocation);
        expect(attachment?.get("mimeType")).toBe("text/plain");
        expect(attachment?.get("origFilename")).toBe(testFileName);
        expect(attachment?.get("title")).toBe(testFileName);

    });

    test("sends request correctly (override spec)", async ()=>{

        const newToken = "newTestToken";
        const newLocation = "newTestLocation";

        const onProgress = jest.fn();

        const attachment = await uploadFile(
            testFile, 
            onProgress,
            {token: newToken, attachmentLocation: newLocation}
        );

        expect(xhrMock.open).toBeCalledTimes(1);
        expect(xhrMock.open).toHaveBeenLastCalledWith('POST', attachmentSettings.write);
        
        expect(xhrMock.send).toBeCalledTimes(1);
        const formData: FormData = xhrMock.send.mock.calls.at(-1)[0];
        
        expect(formData.get('token')).toBe(newToken);
        expect(formData.get("store")).toBe(newLocation);
        expect(formData.get("type")).toBe("O");
        expect(formData.get("coll")).toBe(attachmentSettings.collection);
        expect(formData.get("file")).toBe(testFile);

        expect(attachment?.get("attachmentLocation")).toBe(newLocation);
        expect(attachment?.get("mimeType")).toBe("text/plain");
        expect(attachment?.get("origFilename")).toBe(testFileName);
        expect(attachment?.get("title")).toBe(testFileName);
    });
});