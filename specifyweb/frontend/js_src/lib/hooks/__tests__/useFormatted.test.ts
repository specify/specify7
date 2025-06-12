import { renderHook, waitFor, act } from "@testing-library/react";
import { tables } from "../../components/DataModel/tables";
import { useFormatted } from "../useFormatted";
import { requireContext } from "../../tests/helpers";
import { overrideAjax } from "../../tests/ajax";

requireContext();

describe("useFormatted", ()=>{
    
    const secondCatNo = 7;

    overrideAjax(`/api/specify/collectionobject/?domainfilter=false&catalognumber=${secondCatNo}&collection=4&offset=0`, {"objects": [], "meta": {"limit": 20, "offset": 0, "total_count": 0}});
    
    test("sets the formatted value initially", ()=>{
        const collectionObject = new tables.CollectionObject.Resource({catalogNumber: "5"});
        const { result } = renderHook(()=>useFormatted(collectionObject));

        // Here, the state update to result can occur after the unit test. 
        // See https://github.com/testing-library/react-testing-library/issues/480#issuecomment-530008573

        waitFor(()=>expect(result).toBe("000000005"));

    });

    test("updates formatted value when value changes", ()=>{
        const collectionObject = new tables.CollectionObject.Resource({catalogNumber: "5"});
        const { result } = renderHook(()=>useFormatted(collectionObject));

        // This wait is still needed.
        waitFor(()=>expect(result).toBe("000000005"));

        act(()=>void collectionObject.set("catalogNumber", "7"));

        waitFor(()=>expect(result).toBe("000000007"));
    })
})