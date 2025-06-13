import { renderHook, waitFor, act } from "@testing-library/react";
import { tables } from "../../components/DataModel/tables";
import { requireContext } from "../../tests/helpers";
import { useCollection } from "../useCollection";
import { overrideAjax } from "../../tests/ajax";
import { getResourceApiUrl } from "../../components/DataModel/resource";
import { AnySchema } from "../../components/DataModel/helperTypes";
import { Collection } from "../../components/DataModel/specifyTable";
import { RA } from "../../utils/types";
import { SubViewSortField } from "../../components/FormParse/cells";


requireContext();

describe("useCollection", ()=>{

    const ceID = 10;
    const ctID = 12;
    const ceaID = 13;

    const collectorsIds = [1, 2, 10];
    
    const textField = "text1";
    const textFieldValues = ["text1", "text3", "text2", "text8"];

    const collectors = collectorsIds.map((id, index)=>({
        id,
        resource_uri: getResourceApiUrl("Collector", id),
        [textField]: textFieldValues[index % textFieldValues.length]
    }));

    const collectionObjects = Array.from({length: 25}, (_, id)=>({
        id,
        resource_uri: getResourceApiUrl("CollectionObject", id),
        [textField]: textFieldValues[id % textFieldValues.length]
    }));

    const collectingEventUrl = getResourceApiUrl('CollectingEvent', ceID);
    const collectingTripUrl = getResourceApiUrl("CollectingTrip", ctID);
    const collectingEventAttributeUrl = getResourceApiUrl("CollectingEventAttribute", ceaID);

    const collectingTripContent = {
        id: ctID,
        resource_uri: collectingTripUrl
    }

    const collectingEventAttributeContent = {
        id: ceaID,
        resource_uri: collectingEventAttributeUrl,
    }

    const collectingEventContent = {
        id: ceID,
        resource_uri: collectingEventUrl,
        collectors,
        collectingtrip: collectingTripUrl,
        collectingeventattribute: collectingEventAttributeContent
    }

    const makeBackendResponse = (objects: RA<unknown>, offset: number, total_count: number, limit=20) => ({
        objects,
        meta: {
            limit,
            offset,
            total_count
        }
    })

    const castAsCollection = (data: ReturnType<typeof useCollection>[0]) => (data as Collection<AnySchema>);

    overrideAjax(collectingEventUrl, collectingEventContent);

    test("to-many dependent collection gets fetched and set correctly", async ()=>{

        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const collector = tables.CollectingEvent.strictGetRelationship("collectors");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: collector
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(3);

        await act(async ()=>{
            await result.current[2]({offset: 1});
        });

        expect(castAsCollection(result.current[0]).length).toBe(3);

    });

    overrideAjax(
        `/api/specify/collectionobject/?domainfilter=false&collectingevent=${ceID}&offset=0`,
        makeBackendResponse(collectionObjects.slice(0, -5), 0, collectionObjects.length)
    );

    overrideAjax(
        `/api/specify/collectionobject/?domainfilter=false&collectingevent=${ceID}&offset=20`,
        makeBackendResponse(collectionObjects.slice(20), 20, collectionObjects.length)
    );

    test("to-many independent collection gets fetched and set correctly", async ()=>{
        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const collectionObject = tables.CollectingEvent.strictGetRelationship("collectionobjects");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: collectionObject
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(20);

        await act(async ()=>{
            await result.current[2]({offset: 20});
        });

        await waitFor(()=>{
            expect(castAsCollection(result.current[0]).length).toBe(25);
        });
    });

    test("to-many dependent collection sorts", async () =>{

        let sortBy: SubViewSortField = {
            direction: "asc",
            fieldNames: [textField]
        }

        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const collector = tables.CollectingEvent.strictGetRelationship("collectors");

        const { result, rerender } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: collector,
                sortBy
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(3);

        expect(castAsCollection(result.current[0]).models.map((resource)=>resource.get("text1"))).toEqual(
            ['text1', 'text2', 'text3' ]
        );
        
        sortBy = {...sortBy, direction: "desc"};

        await act(rerender);
    
        await waitFor(()=>{
            expect(castAsCollection(result.current[0]).models.map((resource)=>resource.get("text1"))).toEqual(
                ['text3', 'text2', 'text1' ]
            );
        });

    });

    overrideAjax(collectingTripUrl, collectingTripContent);
    overrideAjax(
        `/api/specify/collectingtrip/?domainfilter=false&collectingevents=${ceID}&offset=1`,
        makeBackendResponse([], 1, 1, 20)
    );

    test("to-one independent (exists) and filter ", async () => {
        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const collectingTrip = tables.CollectingEvent.strictGetRelationship("collectingtrip");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: collectingTrip,
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(1);
        expect(castAsCollection(result.current[0]).models[0].id).toBe(ctID);

        // I'm not sure what the desired behavior here is
        // That is, the query here itself wouldn't be reasonale.
        await act(async ()=>{
            await result.current[2]({offset: 1});
        });

        await waitFor(()=>{
            expect(castAsCollection(result.current[0]).length).toBe(1);
        });

    });

    test("to-one independent (does not exist, and no backref) and filter ", async () => {
        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const discipline = tables.CollectingEvent.strictGetRelationship("discipline");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: discipline,
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(result.current[0]).toBe(false);

        await act(async ()=>{
            await result.current[2]();
        });

        await waitFor(()=>{
            // Because state can possibly be delayed.
            expect(result.current[0]).toBe(false);
        });

    });

    test("to-one independent (does not exist, and backref) and filter ", async () => {
        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const locality = tables.CollectingEvent.strictGetRelationship("locality");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: locality,
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(0);

        await act(async ()=>{
            await result.current[2]();
        });

        expect(castAsCollection(result.current[0]).length).toBe(0);

    });

    test("to-one dependent (parent exists)", async () => {
        const collectingEvent = new tables.CollectingEvent.Resource({id: ceID});
        const collectingEventAttribute = tables.CollectingEvent.strictGetRelationship("collectingeventattribute");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: collectingEventAttribute,
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(1);
        expect(castAsCollection(result.current[0]).models[0].id).toBe(ceaID);
    });

    test("to-one dependent (parent new)", async () => {
        const collectingEvent = new tables.CollectingEvent.Resource();
        const collectingEventAttribute = tables.CollectingEvent.strictGetRelationship("collectingeventattribute");

        const { result } = renderHook(()=>useCollection({
                parentResource: collectingEvent, 
                relationship: collectingEventAttribute,
            }));

        await waitFor(()=>{
            expect(result.current[0]).toBeDefined();
        });

        expect(castAsCollection(result.current[0]).length).toBe(0);
    });

});