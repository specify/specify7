import { act,renderHook, waitFor } from "@testing-library/react";

import { tables } from "../../components/DataModel/tables";
import { requireContext } from "../../tests/helpers";
import { useIsModified } from "../useIsModified";

requireContext();

describe("useIsModifiedTest", ()=>{

    test("handles undefined resource", ()=>{
        const { result } = renderHook(()=>useIsModified(undefined));
        expect(result.current).toBe(false);
    })

    test("returns true when resource needs saved (existing resource)", ()=>{
        const collectionObject = new tables.CollectionObject.Resource({
            id: 1
        });
        collectionObject.set("integer1", 10);
        const { result } = renderHook(()=>useIsModified(collectionObject));
        expect(result.current).toBe(true);
    });

    test("returns true when new resource needs saved only when allowed (new call)", ()=>{
        const collectionObject = new tables.CollectionObject.Resource();

        collectionObject.set("integer1", 10);

        const { result: ignoreNewResult } = renderHook(()=>useIsModified(collectionObject));

        expect(ignoreNewResult.current).toBe(false);

        const { result: newResult } = renderHook(()=>useIsModified(collectionObject, false));

        expect(newResult.current).toBe(true);
    });


    test("returns true when new resource needs saved only when allowed (render diff)", async ()=>{
        const collectionObject = new tables.CollectionObject.Resource();

        collectionObject.set("integer1", 10);

        let ignoreNew = true;

        const { result: ignoreNewResult, rerender } = renderHook(()=>useIsModified(collectionObject, ignoreNew));

        expect(ignoreNewResult.current).toBe(false);

        ignoreNew = false;

        await act(rerender);

        expect(ignoreNewResult.current).toBe(true);
    });

    test("handles saveRequired event", async ()=>{
        const collectionObject = new tables.CollectionObject.Resource({
            id: 1
        });
        const { result } = renderHook(()=>useIsModified(collectionObject));
        expect(result.current).toBe(false);
        /*
         * Here, we aren't concerned with the source of the "saveRequired" (for all we know, something triggered it)
         * So, manually trigger that event, instead of using .set()
         */
        await act(()=>collectionObject.trigger("saverequired"));
        // The event-handler doesn't necessarily run immediately. So, need a waitFor.
        
        waitFor(()=>{
            expect(result.current).toBe(true);
        });
    });

    test("handles saved event", async ()=>{
        const collectionObject = new tables.CollectionObject.Resource({
            id: 1
        });
        collectionObject.set("text1", "changed!");
        const { result } = renderHook(()=>useIsModified(collectionObject));
        expect(result.current).toBe(true);

        await act(()=>collectionObject.trigger("saved"));
        // The event-handler doesn't necessarily run immediately. So, need a waitFor.
        
        waitFor(()=>{
            expect(result.current).toBe(false);
        });
    })

});