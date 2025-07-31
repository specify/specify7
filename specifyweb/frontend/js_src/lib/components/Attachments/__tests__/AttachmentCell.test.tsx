import { waitFor } from "@testing-library/react";
import React from "react";

import * as AsyncState from "../../../hooks/useAsyncState";
import { clearIdStore } from "../../../hooks/useId";
import { overrideAjax } from "../../../tests/ajax";
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { requireContext } from "../../../tests/helpers";
import { mount } from "../../../tests/reactUtils";
import { f } from "../../../utils/functools";
import type { GetOrSet, GetSet } from "../../../utils/types";
import { LoadingContext } from "../../Core/Contexts";
import type { AnySchema, SerializedResource } from "../../DataModel/helperTypes";
import type { SpecifyResource } from "../../DataModel/legacyTypes";
import type { SpecifyTable } from "../../DataModel/specifyTable";
import { tables } from "../../DataModel/tables";
import type { Attachment } from "../../DataModel/types";
import { overrideAttachmentSettings } from "../attachments";
import { AttachmentCell } from "../Cell";

requireContext();

const setStateMock = jest.fn();

beforeEach(() => {
    setStateMock.mockClear();
    clearIdStore();
});

jest.spyOn(AsyncState, 'useAsyncState').mockImplementation(useAsyncRef);

function useAsyncRef<T>(
    callback: () => Promise<T | undefined> | T | undefined,
    _: boolean
): GetOrSet<T | undefined> {
    const ref = React.useRef<T | undefined>(undefined);

    React.useLayoutEffect(() => {
        ref.current = undefined;

        Promise.resolve(callback()).then((data) => {
            if (destructorCalled) return;
            ref.current = data;
            setStateMock(data);
        });

        let destructorCalled = false;

        return () => {
            destructorCalled = true;
        }
    }, [callback]);

    const setCallback = (...value: Parameters<GetOrSet<T | undefined>[1]>) => {
        const setter = value[0];
        ref.current = typeof setter === 'function' ? (setter as Function)(ref.current) : setter;
    }

    return [ref.current, setCallback];
}


function AttachmentCellMock({ options, ...rest }: {
    readonly options: {
        readonly trigger: () => void,
    }
    readonly attachment: SerializedResource<Attachment>;
    readonly onOpen: () => void;
    readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
    readonly onViewRecord:
    | ((table: SpecifyTable, recordId: number) => void)
    | undefined;
}) {
    const [_, setState] = React.useState<boolean>(false);
    const triggerChange = React.useCallback(() => {
        setState((old) => !old);
    }, [setState]);
    options.trigger = triggerChange;
    return (<AttachmentCell {...rest} />)

}
describe("AttachmentCell", () => {

    const attachment = {
        "id": 5490,
        "attachmentLocation": "a6daad6c-5091-4461-86ee-eeba9434ef2b.jpg",
        "attachmentStorageConfig": null,
        "captureDevice": null,
        "copyrightDate": null,
        "copyrightHolder": null,
        "credit": null,
        "dateImaged": null,
        "fileCreatedDate": null,
        "guid": "7664fc1b-cc39-4f7d-b81c-645fc11e8e1d",
        "isPublic": true,
        "license": null,
        "licenseLogoUrl": null,
        "metadataText": null,
        "mimeType": "image/jpeg",
        "origFilename": "topbrc4.jpg",
        "remarks": null,
        "scopeID": null,
        "scopeType": null,
        "subjectOrientation": null,
        "subtype": null,
        "tableID": 1,
        "timestampCreated": "2015-05-20T12:16:38",
        "timestampModified": "2015-05-20T12:16:38",
        "title": "kubiodiversitylogo.jpg",
        "type": null,
        "version": 0,
        "visibility": null,
        "attachmentImageAttribute": null,
        "createdByAgent": "/api/specify/agent/3/",
        "creator": null,
        "modifiedByAgent": null,
        "visibilitySetBy": null,
        "accessionAttachments": "/api/specify/accessionattachment/?attachment=5490",
        "agentAttachments": "/api/specify/agentattachment/?attachment=5490",
        "metadata": "/api/specify/attachmentmetadata/?attachment=5490",
        "tags": "/api/specify/attachmenttag/?attachment=5490",
        "borrowAttachments": "/api/specify/borrowattachment/?attachment=5490",
        "collectingEventAttachments": "/api/specify/collectingeventattachment/?attachment=5490",
        "collectingTripAttachments": "/api/specify/collectingtripattachment/?attachment=5490",
        "collectionObjectAttachments": "/api/specify/collectionobjectattachment/?attachment=5490",
        "conservDescriptionAttachments": "/api/specify/conservdescriptionattachment/?attachment=5490",
        "conservEventAttachments": "/api/specify/conserveventattachment/?attachment=5490",
        "dnaSequenceAttachments": "/api/specify/dnasequenceattachment/?attachment=5490",
        "dnaSequencingRunAttachments": "/api/specify/dnasequencingrunattachment/?attachment=5490",
        "deaccessionAttachments": "/api/specify/deaccessionattachment/?attachment=5490",
        "disposalAttachments": "/api/specify/disposalattachment/?attachment=5490",
        "exchangeInAttachments": "/api/specify/exchangeinattachment/?attachment=5490",
        "exchangeOutAttachments": "/api/specify/exchangeoutattachment/?attachment=5490",
        "fieldNotebookAttachments": "/api/specify/fieldnotebookattachment/?attachment=5490",
        "fieldNotebookPageAttachments": "/api/specify/fieldnotebookpageattachment/?attachment=5490",
        "fieldNotebookPageSetAttachments": "/api/specify/fieldnotebookpagesetattachment/?attachment=5490",
        "giftAttachments": "/api/specify/giftattachment/?attachment=5490",
        "loanAttachments": "/api/specify/loanattachment/?attachment=5490",
        "localityAttachments": "/api/specify/localityattachment/?attachment=5490",
        "permitAttachments": "/api/specify/permitattachment/?attachment=5490",
        "preparationAttachments": "/api/specify/preparationattachment/?attachment=5490",
        "referenceWorkAttachments": "/api/specify/referenceworkattachment/?attachment=5490",
        "repositoryAgreementAttachments": "/api/specify/repositoryagreementattachment/?attachment=5490",
        "storageAttachments": "/api/specify/storageattachment/?attachment=5490",
        "taxonAttachments": "/api/specify/taxonattachment/?attachment=5490",
        "treatmentEventAttachments": "/api/specify/treatmenteventattachment/?attachment=5490",
        "spDataSetAttachments": "/api/specify/spdatasetattachment/?attachment=5490",
        "resource_uri": "/api/specify/attachment/5490/",
        "_tableName": "Attachment"
    } as const;

    const collectionObjectAttachment = {
        "id": 4732,
        "collectionmemberid": 4,
        "ordinal": 0,
        "remarks": null,
        "timestampcreated": "2025-07-31T17:00:40",
        "timestampmodified": "2025-07-31T17:00:40",
        "version": 0,
        attachment,
        "collectionobject": "/api/specify/collectionobject/51731/",
        "createdbyagent": "/api/specify/agent/3/",
        "modifiedbyagent": null,
        "resource_uri": "/api/specify/collectionobjectattachment/4732/"
    }

    overrideAjax("/api/specify/collectionobjectattachment/?limit=20&attachment=5490",
        {
            "objects": [
                collectionObjectAttachment
            ],
            "meta": {
                "limit": 20,
                "offset": 0,
                "total_count": 1
            }
        })


    test("simple render", async () => {

        jest.spyOn(console, 'warn').mockImplementation();

        const handleOpen = jest.fn();
        const setRelated = jest.fn();
        const handleViewRecord = jest.fn();
        const options = { trigger: f.never }
        overrideAttachmentSettings(attachmentSettings);

        const { asFragment, rerender, getAllByRole, user } = mount(
            <LoadingContext.Provider value={f.void} >
                <AttachmentCellMock
                    attachment={attachment}
                    options={options}
                    related={[undefined, setRelated]}
                    onOpen={handleOpen}
                    onViewRecord={handleViewRecord}
                />
            </LoadingContext.Provider>
        );

        await waitFor(() => { expect(setStateMock).toHaveBeenCalled() });

        rerender(
            <LoadingContext.Provider value={f.void} >
                <AttachmentCellMock
                    attachment={attachment}
                    options={options}
                    related={[undefined, setRelated]}
                    onOpen={handleOpen}
                    onViewRecord={handleViewRecord}
                />
            </LoadingContext.Provider>
        );

        expect(asFragment()).toMatchSnapshot();

        const button = getAllByRole('button')[1];

        expect(handleOpen).not.toHaveBeenCalled();
        await user.click(button)

        expect(handleOpen).toHaveBeenCalled();

        const relatedButton = getAllByRole('button')[0];
        await user.click(relatedButton);
        expect(setRelated.mock.lastCall).toMatchSnapshot();

        expect(handleViewRecord).toHaveBeenCalled();
        expect(handleViewRecord).toHaveBeenCalledWith(tables.CollectionObject, 51_731);

    });
})