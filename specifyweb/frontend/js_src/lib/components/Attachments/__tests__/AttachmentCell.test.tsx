import { waitFor } from "@testing-library/react";
import React from "react";

import * as AsyncState from "../../../hooks/useAsyncState";
import { clearIdStore } from "../../../hooks/useId";
import { overrideAjax } from "../../../tests/ajax";
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { requireContext } from "../../../tests/helpers";
import { mount } from "../../../tests/reactUtils";
import { f } from "../../../utils/functools";
import { type GetSet, overwriteReadOnly } from "../../../utils/types";
import { LoadingContext } from "../../Core/Contexts";
import type { AnySchema, SerializedResource } from "../../DataModel/helperTypes";
import type { SpecifyResource } from "../../DataModel/legacyTypes";
import type { SpecifyTable } from "../../DataModel/specifyTable";
import { tables } from "../../DataModel/tables";
import type { Attachment } from "../../DataModel/types";
import { overrideAttachmentSettings } from "../attachments";
import { AttachmentCell } from "../Cell";
import { makeUseAsyncRef, testStaticResources } from "./utils"

requireContext();

const setStateMock = jest.fn();

const { testAttachment, testCollectionObjectAttachment } = testStaticResources;

beforeEach(() => {
    setStateMock.mockClear();
    clearIdStore();
});

const useAsyncRef = makeUseAsyncRef(setStateMock);

jest.spyOn(AsyncState, 'useAsyncState').mockImplementation(useAsyncRef);

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
    overwriteReadOnly(options, 'trigger', triggerChange);
    return (<AttachmentCell {...rest} />)

}
describe("AttachmentCell", () => {

    overrideAjax("/api/specify/collectionobjectattachment/?limit=20&attachment=5490",
        {
            "objects": [
                testCollectionObjectAttachment
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
                    attachment={testAttachment}
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
                    attachment={testAttachment}
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