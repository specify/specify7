import React from "react";
import { requireContext } from "../../../tests/helpers";
import { mount } from "../../../tests/reactUtils";
import { deserializeResource } from "../../DataModel/serializers";
import { AttachmentDialog } from "../Dialog";
import { makeUseAsyncRef, testStaticResources } from "./utils";
import { UnloadProtectsContext } from "../../Router/UnloadProtect";
import { TestComponentWrapperRouter } from "../../../tests/utils";
import { AnySchema, SerializedResource } from "../../DataModel/helperTypes";
import { clearIdStore } from "../../../hooks/useId";
import * as AsyncState from "../../../hooks/useAsyncState";
import { overrideAjax } from "../../../tests/ajax";
import { RA } from "../../../utils/types";
import { act } from "react-dom/test-utils";
import { resourceOn } from "../../DataModel/resource";
import { overrideAttachmentSettings } from "../attachments";
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { waitFor } from "@testing-library/react";

const { testAttachment, testCollectionObjectAttachment } = testStaticResources;

requireContext();

const setStateMock = jest.fn();

beforeEach(() => {
    setStateMock.mockClear();
    clearIdStore();
});

const oldSetState = React.useState;


function useStateMock(defaultValue: unknown) {
    const [state, rawSetState] = oldSetState(defaultValue);
    const setState = React.useCallback((value: unknown | ((oldValue: unknown) => unknown)) => {
        act(() => rawSetState(value))
    }, [rawSetState]);
    return [state, setState] as const;
}

const useAsyncRef = makeUseAsyncRef(setStateMock);
// jest.spyOn(Resource, 'resourceOn').mockImplementation(resourceOnMock);
jest.spyOn(AsyncState, 'useAsyncState').mockImplementation(useAsyncRef);
jest.spyOn(React, 'useState').mockImplementation(useStateMock as typeof oldSetState);

describe("AttachmentDialog", () => {

    overrideAjax("/context/view.json?name=ObjectAttachment&quiet=", {
        "name": "ObjectAttachment",
        "class": "edu.ku.brc.specify.datamodel.ObjectAttachmentIFace",
        "busrules": "edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules",
        "resourcelabels": "false",
        "altviews": {
            "ObjectAttachment Icon View": {
                "name": "ObjectAttachment Icon View",
                "viewdef": "ObjectAttachment IconView",
                "mode": "view"
            },
            "ObjectAttachment Icon Edit": {
                "name": "ObjectAttachment Icon Edit",
                "viewdef": "ObjectAttachment IconView",
                "mode": "edit"
            },
            "ObjectAttachment Table View": {
                "name": "ObjectAttachment Table View",
                "viewdef": "ObjectAttachment Table",
                "mode": "view"
            },
            "ObjectAttachment Table Edit": {
                "name": "ObjectAttachment Table Edit",
                "viewdef": "ObjectAttachment Table",
                "mode": "edit"
            },
            "ObjectAttachment Form View": {
                "name": "ObjectAttachment Form View",
                "viewdef": "ObjectAttachment Form",
                "label": "Form",
                "mode": "view",
                "default": "true"
            },
            "ObjectAttachment Form Edit": {
                "name": "ObjectAttachment Form Edit",
                "viewdef": "ObjectAttachment Form",
                "label": "Form",
                "mode": "edit"
            }
        },
        "viewdefs": {
            "ObjectAttachment Table": "\u003Cviewdef type=\"formtable\" name=\"ObjectAttachment Table\" class=\"edu.ku.brc.specify.datamodel.ObjectAttachmentIFace\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\"\u003E\n\t\t\t\u003Cdesc\u003EObjectAttachment grid view.\u003C/desc\u003E\n\t\t\t\u003Cdefinition\u003EObjectAttachment Form\u003C/definition\u003E\n\t\t\u003C/viewdef\u003E\n\t\t",
            "ObjectAttachment Form": "\u003Cviewdef type=\"form\" name=\"ObjectAttachment Form\" class=\"edu.ku.brc.specify.datamodel.ObjectAttachmentIFace\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\" useresourcelabels=\"true\"\u003E\n\t\t\t\u003Cdesc\u003EThe ObjectAttachment form.\u003C/desc\u003E\n\t\t\t\u003CcolumnDef\u003Ep,2px,p:g\u003C/columnDef\u003E\n\t\t\t\u003CrowDef auto=\"true\" cell=\"p\" sep=\"2px\" /\u003E\n\t\t\t\u003Crows\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"origFilename\" label=\"FILENAME\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"origFilename\" name=\"attachment.origFilename\" initialize=\"editoncreate=true\" uitype=\"browse\" isrequired=\"true\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"title\" label=\"TITLE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"title\" name=\"attachment.title\" uitype=\"text\" isrequired=\"true\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"ispub\" label=\"\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"ispub\" name=\"attachment.isPublic\" uitype=\"checkbox\" label=\"Make Public\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003C!--   \u003Crow\u003E\n    \t\t        \u003Ccell type=\"subview\" id=\"metadata\" name=\"attachment.metadata\" viewname=\"AttachmentMetadata\" colspan=\"3\"/\u003E\n    \t\t    \u003C/row\u003E --\u003E\n\t\t\t\u003C/rows\u003E\n\t\t\u003C/viewdef\u003E\n\t\t",
            "ObjectAttachment IconView": "\u003Cviewdef type=\"iconview\" name=\"ObjectAttachment IconView\" class=\"edu.ku.brc.specify.datamodel.ObjectAttachmentIFace\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\"\u003E\n\t\t\t\u003Cdesc\u003EThe ObjectAttachment Icon Viewer\u003C/desc\u003E\n\t\t\u003C/viewdef\u003E\n\t\t"
        },
        "view": "\u003Cview name=\"ObjectAttachment\" class=\"edu.ku.brc.specify.datamodel.ObjectAttachmentIFace\" busrules=\"edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules\" resourcelabels=\"false\"\u003E\n\t\t\t\u003Cdesc\u003EThe Object-Attachment View.\u003C/desc\u003E\n\t\t\t\u003Caltviews\u003E\n\t\t\t\t\u003Caltview name=\"ObjectAttachment Icon View\" viewdef=\"ObjectAttachment IconView\" mode=\"view\" /\u003E\n\t\t\t\t\u003Caltview name=\"ObjectAttachment Icon Edit\" viewdef=\"ObjectAttachment IconView\" mode=\"edit\" /\u003E\n\t\t\t\t\u003Caltview name=\"ObjectAttachment Table View\" viewdef=\"ObjectAttachment Table\" mode=\"view\" /\u003E\n\t\t\t\t\u003Caltview name=\"ObjectAttachment Table Edit\" viewdef=\"ObjectAttachment Table\" mode=\"edit\" /\u003E\n\t\t\t\t\u003Caltview name=\"ObjectAttachment Form View\" viewdef=\"ObjectAttachment Form\" label=\"Form\" mode=\"view\" default=\"true\" /\u003E\n\t\t\t\t\u003Caltview name=\"ObjectAttachment Form Edit\" viewdef=\"ObjectAttachment Form\" label=\"Form\" mode=\"edit\" /\u003E\n\t\t\t\u003C/altviews\u003E\n\t\t\u003C/view\u003E\n\t\t",
        "viewsetName": "Global",
        "viewsetLevel": "Backstop",
        "viewsetSource": "disk",
        "viewsetId": null,
        "viewsetFile": "backstop/global.views.xml"
    });

    overrideAjax("/context/view.json?name=CollectionObjectAttachment&quiet=", {
        "name": "CollectionObjectAttachment",
        "class": "edu.ku.brc.specify.datamodel.CollectionObjectAttachment",
        "busrules": "edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules",
        "resourcelabels": "false",
        "altviews": {
            "CollectionObjectAttachment Icon View": {
                "name": "CollectionObjectAttachment Icon View",
                "viewdef": "CollectionObjectAttachment IconView",
                "mode": "view"
            },
            "CollectionObjectAttachment Icon Edit": {
                "name": "CollectionObjectAttachment Icon Edit",
                "viewdef": "CollectionObjectAttachment IconView",
                "mode": "edit"
            },
            "CollectionObjectAttachment Table View": {
                "name": "CollectionObjectAttachment Table View",
                "viewdef": "CollectionObjectAttachment Table",
                "mode": "view"
            },
            "CollectionObjectAttachment Table Edit": {
                "name": "CollectionObjectAttachment Table Edit",
                "viewdef": "CollectionObjectAttachment Table",
                "mode": "edit"
            },
            "CollectionObjectAttachment Form View": {
                "name": "CollectionObjectAttachment Form View",
                "viewdef": "CollectionObjectAttachment Form",
                "label": "Form",
                "mode": "view",
                "default": "true"
            },
            "CollectionObjectAttachment Form Edit": {
                "name": "CollectionObjectAttachment Form Edit",
                "viewdef": "CollectionObjectAttachment Form",
                "label": "Form",
                "mode": "edit"
            }
        },
        "viewdefs": {
            "CollectionObjectAttachment Form": "\u003Cviewdef type=\"form\" name=\"CollectionObjectAttachment Form\" class=\"edu.ku.brc.specify.datamodel.CollectionObjectAttachment\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\" useresourcelabels=\"true\"\u003E\n\t\t\t\u003Cdesc\u003EThe CollectionObjectAttachment form.\u003C/desc\u003E\n\t\t\t\u003C!--\u003CcolumnDef\u003E110px,2dlu,p:g,5dlu,100px,2dlu,85px\u003C/columnDef\u003E --\u003E\n\t\t\t\u003CcolumnDef\u003Ep,5dlu,p:g\u003C/columnDef\u003E\n\t\t\t\u003CrowDef auto=\"true\" cell=\"p\" sep=\"2px\" /\u003E\n\t\t\t\u003Crows\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"origFilename\" label=\"FILENAME\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"origFilename\" name=\"attachment.origFilename\" initialize=\"editoncreate=true\" uitype=\"browse\" isrequired=\"true\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"title\" label=\"TITLE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"title\" name=\"attachment.title\" isrequired=\"true\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003C!--\u003Crow\u003E\n                    \u003Ccell type=\"subview\" id=\"metadata\" name=\"attachment.metadata\" viewname=\"AttachmentMetadata\" colspan=\"3\"/\u003E\n                \u003C/row\u003E --\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"dateImaged\" label=\"DATE_IMAGED\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"dateImaged\" name=\"attachment.dateImaged\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"fileCreatedDate\" label=\"FILE_CREATED_DATE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"fileCreatedDate\" name=\"attachment.fileCreatedDate\" uitype=\"formattedtext\" uifieldformatter=\"Date\" default=\"today\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"copyrightHolder\" label=\"COPYRIGHT_HOLDER\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"copyrightHolder\" name=\"attachment.copyrightHolder\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"copyrightDate\" label=\"COPYRIGHT_DATE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"copyrightDate\" name=\"attachment.copyrightDate\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"attachmentLocation\" label=\"ATTACHMENT_LOCATION\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"attachmentLocation\" name=\"attachment.attachmentLocation\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"isPublic\" label=\"is public\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"isPublic\" name=\"attachment.isPublic\" isrequired=\"true\" uitype=\"checkbox\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"license\" label=\"LICENSE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"license\" name=\"attachment.license\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"credit\" label=\"CREDIT\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"credit\" name=\"attachment.credit\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"mimeType\" label=\"MIME_TYPE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"mimeType\" name=\"attachment.mimeType\" uitype=\"text\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"remarks\" label=\"REMARKS\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"remarks\" name=\"attachment.remarks\" uitype=\"textareabrief\" rows=\"2\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003C!--\u003Crow\u003E\n                    \u003Ccell type=\"subview\" id=\"imageatt\" viewname=\"AttachmentImageAttribute\" name=\"attachment.attachmentImageAttribute\" colspan=\"3\" /\u003E\n                \u003C/row\u003E--\u003E\n\t\t\t\u003C/rows\u003E\n\t\t\u003C/viewdef\u003E\n\t\t",
            "CollectionObjectAttachment Table": "\u003Cviewdef type=\"formtable\" name=\"CollectionObjectAttachment Table\" class=\"edu.ku.brc.specify.datamodel.CollectionObjectAttachment\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\"\u003E\n\t\t\t\u003Cdesc\u003EObjectAttachment grid view.\u003C/desc\u003E\n\t\t\t\u003Cdefinition\u003EObjectAttachment Form\u003C/definition\u003E\n\t\t\u003C/viewdef\u003E\n\t\t",
            "CollectionObjectAttachment IconView": "\u003Cviewdef type=\"iconview\" name=\"CollectionObjectAttachment IconView\" class=\"edu.ku.brc.specify.datamodel.CollectionObjectAttachment\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\"\u003E\n\t\t\t\u003Cdesc\u003EThe ObjectAttachment Icon Viewer\u003C/desc\u003E\n\t\t\u003C/viewdef\u003E\n\t\t",
            "ObjectAttachment Form": "\u003Cviewdef type=\"form\" name=\"ObjectAttachment Form\" class=\"edu.ku.brc.specify.datamodel.ObjectAttachmentIFace\" gettable=\"edu.ku.brc.af.ui.forms.DataGetterForObj\" settable=\"edu.ku.brc.af.ui.forms.DataSetterForObj\" useresourcelabels=\"true\"\u003E\n\t\t\t\u003Cdesc\u003EThe ObjectAttachment form.\u003C/desc\u003E\n\t\t\t\u003CcolumnDef\u003Ep,2px,p:g\u003C/columnDef\u003E\n\t\t\t\u003CrowDef auto=\"true\" cell=\"p\" sep=\"2px\" /\u003E\n\t\t\t\u003Crows\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"origFilename\" label=\"FILENAME\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"origFilename\" name=\"attachment.origFilename\" initialize=\"editoncreate=true\" uitype=\"browse\" isrequired=\"true\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"title\" label=\"TITLE\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"title\" name=\"attachment.title\" uitype=\"text\" isrequired=\"true\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003Crow\u003E\n\t\t\t\t\t\u003Ccell type=\"label\" labelfor=\"ispub\" label=\"\" /\u003E\n\t\t\t\t\t\u003Ccell type=\"field\" id=\"ispub\" name=\"attachment.isPublic\" uitype=\"checkbox\" label=\"Make Public\" /\u003E\n\t\t\t\t\u003C/row\u003E\n\t\t\t\t\u003C!--   \u003Crow\u003E\n    \t\t        \u003Ccell type=\"subview\" id=\"metadata\" name=\"attachment.metadata\" viewname=\"AttachmentMetadata\" colspan=\"3\"/\u003E\n    \t\t    \u003C/row\u003E --\u003E\n\t\t\t\u003C/rows\u003E\n\t\t\u003C/viewdef\u003E\n\t\t"
        },
        "view": "\u003Cview name=\"CollectionObjectAttachment\" class=\"edu.ku.brc.specify.datamodel.CollectionObjectAttachment\" busrules=\"edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules\" resourcelabels=\"false\"\u003E\n\t\t\t\u003Cdesc\u003EThe Collection Object-Attachment View.\u003C/desc\u003E\n\t\t\t\u003Caltviews\u003E\n\t\t\t\t\u003Caltview name=\"CollectionObjectAttachment Icon View\" viewdef=\"CollectionObjectAttachment IconView\" mode=\"view\" /\u003E\n\t\t\t\t\u003Caltview name=\"CollectionObjectAttachment Icon Edit\" viewdef=\"CollectionObjectAttachment IconView\" mode=\"edit\" /\u003E\n\t\t\t\t\u003Caltview name=\"CollectionObjectAttachment Table View\" viewdef=\"CollectionObjectAttachment Table\" mode=\"view\" /\u003E\n\t\t\t\t\u003Caltview name=\"CollectionObjectAttachment Table Edit\" viewdef=\"CollectionObjectAttachment Table\" mode=\"edit\" /\u003E\n\t\t\t\t\u003Caltview name=\"CollectionObjectAttachment Form View\" viewdef=\"CollectionObjectAttachment Form\" label=\"Form\" mode=\"view\" default=\"true\" /\u003E\n\t\t\t\t\u003Caltview name=\"CollectionObjectAttachment Form Edit\" viewdef=\"CollectionObjectAttachment Form\" label=\"Form\" mode=\"edit\" /\u003E\n\t\t\t\u003C/altviews\u003E\n\t\t\u003C/view\u003E\n\t\t",
        "viewsetName": "Global",
        "viewsetLevel": "Backstop",
        "viewsetSource": "disk",
        "viewsetId": null,
        "viewsetFile": "backstop/global.views.xml"
    });

    test("simple render", async () => {
        jest.spyOn(console, 'warn').mockImplementation();

        overrideAttachmentSettings(attachmentSettings);

        const setRelated = jest.fn();
        const handleClose = jest.fn();
        const handleChange = jest.fn();
        const handlePrevious = jest.fn();
        const handleNext = jest.fn();
        const handleViewRecord = jest.fn();

        const related = deserializeResource(testCollectionObjectAttachment as unknown as SerializedResource<AnySchema>);

        const { getByRole, rerender } = mount(
            <TestComponentWrapperRouter
                initialEntries={['/attachments/']}
                path="attachments"
            >
                <UnloadProtectsContext.Provider value={[]}>
                    <AttachmentDialog
                        attachment={testAttachment}
                        related={[related, setRelated]}
                        onClose={handleClose}
                        onChange={handleChange}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        onViewRecord={handleViewRecord}
                    />
                </UnloadProtectsContext.Provider>
            </TestComponentWrapperRouter>
        );

        const dialog = getByRole('dialog');
        await waitFor(() => {
            expect(setStateMock).toBeCalled();
        });
        expect(dialog).toMatchSnapshot();

    });

});