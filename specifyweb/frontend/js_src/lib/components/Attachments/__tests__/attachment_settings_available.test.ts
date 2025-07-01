import { waitFor } from "@testing-library/react";

import { requireContext } from "../../../tests/helpers";
import { attachmentsAvailable, attachmentSettingsPromise } from "../attachments";

requireContext();

describe("attachmentSettingsPromise", ()=>{

    test("settings get loaded", ()=>{
        expect(attachmentSettingsPromise).resolves.toBe(true);
    });
});

describe("attachmentsAvailable", ()=>{

    test("eventually returns true", async ()=>{
        waitFor(()=>{
            expect(attachmentsAvailable()).toBe(true);
        });
    });
});