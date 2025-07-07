import { renderHook, waitFor } from "@testing-library/react";
import { useAppResourceData } from "../hooks";
import { staticAppResources } from "./staticAppResources";
import { useAsyncStateMock } from "../../../hooks/useAsyncStateMock";
import { requireContext } from "../../../tests/helpers";
import { overrideAjax } from "../../../tests/ajax";
import { tables } from "../../DataModel/tables";
import { serializeResource } from "../../DataModel/serializers";

requireContext();

const mockFn = jest.fn();

function mockState<T>(
    callback: () => Promise<T | undefined> | undefined,
) {
    useAsyncStateMock(callback, mockFn);
    return [undefined, undefined];
}

jest.mock("../../../hooks/useAsyncState", () => {
    const module = jest.requireActual("../../../hooks/useAsyncState");
    return {
        ...module,
        useAsyncState: mockState
    }
});

describe("useAppResourceData", ()=>{

    const spAppResourceData =  {
        "id": 10,
        "data": "<vector>\n  <weblinkdef>\n    <name><![CDATA[MailTo]]></name>\n    <tableName><![CDATA[agent]]></tableName>\n    <desc><![CDATA[Launches an email message window for sending an email.]]></desc>\n    <baseURLStr><![CDATA[mailto:<email>]]></baseURLStr>\n    <args>\n      <weblinkdefarg>\n        <name><![CDATA[email]]></name>\n        <title><![CDATA[EMail]]></title>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n    </args>\n    <usedByList>\n      <usedby>\n        <tableName><![CDATA[agent]]></tableName>\n        <fieldName><![CDATA[email]]></fieldName>\n      </usedby>\n    </usedByList>\n  </weblinkdef>\n  <weblinkdef>\n    <name><![CDATA[FishBase]]></name>\n    <desc><![CDATA[Displays a FishBase page for the Genus and Species]]></desc>\n    <baseURLStr><![CDATA[http://www.fishbase.org/Summary/speciesSummary.php?genusname=<genus>AMPspeciesname=<species>]]></baseURLStr>\n    <args>\n      <weblinkdefarg>\n        <name><![CDATA[genus]]></name>\n        <title><![CDATA[Genus]]></title>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n      <weblinkdefarg>\n        <name><![CDATA[species]]></name>\n        <title><![CDATA[Species]]></title>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n    </args>\n    <usedByList/>\n  </weblinkdef>\n  <weblinkdef>\n    <name><![CDATA[WEBLINK]]></name>\n    <tableName><![CDATA[]]></tableName>\n    <desc><![CDATA[]]></desc>\n    <baseURLStr><![CDATA[http://specify6-test.nhm.ku.edu/echo.php?text1=<this>]]></baseURLStr>\n    <args>\n      <weblinkdefarg>\n        <name><![CDATA[this]]></name>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n    </args>\n    <usedByList/>\n  </weblinkdef>\n  <weblinkdef>\n    <name><![CDATA[AccessionNumber]]></name>\n    <tableName><![CDATA[accession]]></tableName>\n    <desc><![CDATA[]]></desc>\n    <baseURLStr><![CDATA[http://specify6-test.nhm.ku.edu/echo.php?text1=<accessionNumber>]]></baseURLStr>\n    <args>\n      <weblinkdefarg>\n        <name><![CDATA[accessionNumber]]></name>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n    </args>\n    <usedByList/>\n  </weblinkdef>\n  <weblinkdef>\n    <name><![CDATA[Genbank]]></name>\n    <desc><![CDATA[]]></desc>\n    <baseURLStr><![CDATA[http://www.ncbi.nlm.nih.gov/nuccore/<this>]]></baseURLStr>\n    <args>\n      <weblinkdefarg>\n        <name><![CDATA[this]]></name>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n    </args>\n    <usedByList/>\n  </weblinkdef>\n  <weblinkdef>\n    <name><![CDATA[GUID]]></name>\n    <desc><![CDATA[]]></desc>\n    <baseURLStr><![CDATA[urn:uuid:<this>]]></baseURLStr>\n    <args>\n      <weblinkdefarg>\n        <name><![CDATA[this]]></name>\n        <prompt><![CDATA[false]]></prompt>\n        <isEditable><![CDATA[false]]></isEditable>\n      </weblinkdefarg>\n    </args>\n    <usedByList/>\n  </weblinkdef>\n</vector>",
        "timestampCreated": "2012-10-04T14:25:12",
        "timestampModified": "2012-10-04T14:25:12",
        "version": 3,
        "createdByAgent": "/api/specify/agent/3/",
        "modifiedByAgent": null,
        "spAppResource": "/api/specify/spappresource/3/",
        "spViewSetObj": null,
        "resource_uri": "/api/specify/spappresourcedata/10/",
        "_tableName": "SpAppResourceData"
    };

    overrideAjax("/api/specify/spappresourcedata/?limit=1&spappresource=3", 
        {
            "objects": [spAppResourceData],
            "meta": {
                "limit": 1,
                "offset": 0,
                "total_count": 1
            }
    });

    test("data for existing resource", async ()=>{

        renderHook(()=>useAppResourceData(staticAppResources.appResources[0], undefined));

        await waitFor(()=>{
            expect(mockFn).toBeCalledTimes(1);
            expect(mockFn.mock.lastCall[0]).toEqual(spAppResourceData);
        });

    });

    test("data for new resource", async ()=>{

        const appResource = new tables.SpAppResource.Resource();

        renderHook(()=>useAppResourceData(serializeResource(appResource), "this is new value"));

        await waitFor(()=>{
            expect(mockFn).toBeCalledTimes(1);
            expect(mockFn.mock.lastCall[0].data).toEqual("this is new value");
        });

    });
});