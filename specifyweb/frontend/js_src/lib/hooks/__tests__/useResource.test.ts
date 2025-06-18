import { act, renderHook, waitFor } from "@testing-library/react";

import { serializeResource } from "../../components/DataModel/serializers";
import { tables } from "../../components/DataModel/tables";
import { requireContext } from "../../tests/helpers";
import { useResource } from "../resource";


requireContext();


describe("useResource", ()=>{
    
    test("initial resource state set", ()=>{
        const collectionObject = new tables.CollectionObject.Resource(
            {id: 10, text1: "Some text value", catalogNumber: "20"}
        );

        const serializedResource = serializeResource(collectionObject);

        const { result } = renderHook(()=>useResource(collectionObject));

        expect(result.current[0]).toEqual(serializedResource);

    });

    test("serialized resource changes on backbone events", async ()=>{

        const collectionObject = new tables.CollectionObject.Resource(
            {id: 10, text1: "Some text value", catalogNumber: "20"}
        );

        const { result } = renderHook(()=>useResource(collectionObject));

        await waitFor(()=>{
            expect(result.current[0].text3).toBeNull();
            expect(result.current[0].text1).toBe( "Some text value");
        });

        act(()=>{
            collectionObject.set("text3", "This is brand new value!");
            collectionObject.set("text1", "This is changed value!");
        });

        await waitFor(()=>{
            expect(result.current[0].text3).toBe("This is brand new value!");
            expect(result.current[0].text1).toBe("This is changed value!");
        });

    });

    test("new resource on rerender", async ()=>{

        const firstCollectionObject = new tables.CollectionObject.Resource(
            {id: 10, text1: "Some text value", catalogNumber: "20"}
        );

        const secondCollectionObject = new tables.CollectionObject.Resource(
            {id: 20, text1: "This is entirely new CO", catalogNumber: "20"}
        );

        let resource = firstCollectionObject;

        const { result, rerender } = renderHook(()=>useResource(resource));

        expect(result.current[0]).toEqual(serializeResource(resource));

        resource = secondCollectionObject;

        await act(rerender);

        expect(result.current[0]).toEqual(serializeResource(resource));

    });

    test("backbone attributes change on serialized change", async ()=>{

        const collectionObject = new tables.CollectionObject.Resource(
            {id: 10, text1: "Some text value", catalogNumber: "20"}
        );

        const { result } = renderHook(()=>useResource(collectionObject));

        expect(result.current[0]).toEqual(serializeResource(collectionObject));

        act(()=>{
            result.current[1]({...result.current[0], text1: "changed via serialized", text2: "set via serialized"});
        })

        await waitFor(()=>{
            expect(collectionObject.get("text1")).toBe("changed via serialized");
            expect(collectionObject.get("text2")).toBe("set via serialized");
        });

    });

});