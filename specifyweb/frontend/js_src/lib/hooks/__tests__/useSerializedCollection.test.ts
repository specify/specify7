import { act, renderHook, waitFor } from "@testing-library/react";
import { SerializedCollection } from "../../components/DataModel/collection";
import { serializeResource } from "../../components/DataModel/serializers";
import { tables } from "../../components/DataModel/tables"
import { CollectionObject } from "../../components/DataModel/types";
import { useSerializedCollection } from "../useSerializedCollection";
import { AnySchema, SerializedResource } from "../../components/DataModel/helperTypes";
import { defined, RA } from "../../utils/types";
import { requireContext } from "../../tests/helpers";

requireContext();

type Fetcher = (offset: number) => Promise<SerializedCollection<CollectionObject>>;


describe("use serialized collection", ()=>{

    const makeFakeResources = (count: number) => Array.from({ length: count }, (_, index) => {
        const resource = new tables.CollectionObject.Resource({
        id: index + 1
        });
        const value = serializeResource(resource);
        return value;
    });

    function makeCollection(records: RA<SerializedResource<CollectionObject>>, totalCount: number): SerializedCollection<CollectionObject> {
        return {
            records,
            totalCount
        }
    }

    function verifyCollections<SCHEMA extends AnySchema>(
        baseCollection: SerializedCollection<SCHEMA>,
        unsafeCompareCollection: ReturnType<typeof useSerializedCollection<CollectionObject>>[number]
    ){
        const compareCollection = unsafeCompareCollection as SerializedCollection<CollectionObject>;
        expect(compareCollection).not.toBe(undefined);

        expect(baseCollection.totalCount).toBe(compareCollection?.totalCount);
        expect(baseCollection.records.length).toBe(compareCollection?.records.length);
        
        baseCollection.records.map((record, index)=>{
            expect(record.id).toBe(compareCollection?.records[index].id);
        })
    
    }

    const singleFetchCount = 5;
    
    const singleFetchResources: ()=>SerializedCollection<CollectionObject> = () => ({
            records: makeFakeResources(singleFetchCount), 
            totalCount: singleFetchCount
    });

    const typeCastCall = (value: unknown) => (value as ()=>Promise<void>)();

    const assertRecordLength = (record: ReturnType<typeof useSerializedCollection<CollectionObject>>[number] | undefined, expectedLength: number) => {
        expect(record).toBeDefined();
        expect((record as unknown as SerializedCollection<CollectionObject>).records.length).toBe(expectedLength);
    }

    it("fetches resources initially", async ()=>{

        const fetcher = jest.fn();
        fetcher.mockReturnValue(Promise.resolve(singleFetchResources()));

        const { result } = renderHook((_fetcher: Fetcher)=>useSerializedCollection(_fetcher), {
            initialProps: fetcher
        });

        // The promise chain is susceptible to race conditions, so this needs to be done.
        await waitFor(()=>{
            expect(result.current?.at(0)).toBeDefined();
        }
        );

        verifyCollections(singleFetchResources(), result.current?.at(0));
        expect(fetcher).toBeCalledTimes(1);

    });

    it("does not call the fetch function if in-flight", async () => {
        
        let inFlightResolver: ((value: undefined)=>void) | undefined;

        const inFlightPromise = new Promise((resolve)=>{
            inFlightResolver = resolve;
        });

        const mockFetch = ()=>inFlightPromise.then(()=>Promise.resolve(singleFetchResources()));

        const fetcher = jest.fn();
        fetcher.mockImplementation(mockFetch);

        const { result } = renderHook((_fetcher: Fetcher)=>useSerializedCollection(_fetcher), {
            initialProps: fetcher
        });

        // first wait for the first fetch to be called (there is a possibler race condition that prevents it)

        await waitFor(()=>{
            expect(fetcher).toBeCalledTimes(1);
        });

        // Now, the first fetch is in-flight. call fetchMore.
        typeCastCall(result.current?.at(2));

        // There could, theoretically, be a false alarm here.
        expect(fetcher).toBeCalledTimes(1);
        
        // Now, assert that the resources have not been fetched yet.
        expect(result.current?.at(0)).not.toBeDefined();

        inFlightResolver?.(undefined);

        await waitFor(()=>{
            expect(result.current?.at(0)).toBeDefined();
        }
        );

        verifyCollections(singleFetchResources(), result.current?.at(0));
        expect(fetcher).toBeCalledTimes(1);
    });

    it("keeps fetching till total count is reached", async () => {

        const totalCount = 16;
        const fakeResources = makeFakeResources(totalCount);


        const firstLength = 6;
        const secondLength = 7;
        const thirdLength = 3;

        // It'll be bad if this fails.
        expect(firstLength + secondLength + thirdLength).toBe(totalCount);

        const lengths = [firstLength, secondLength, thirdLength].reduce(
            (previous, current)=>[...previous, defined(previous.at(-1)) + current],
            [0]
        );

        const chunks = lengths.slice(0, -1).map((start, index)=>{
            return fakeResources.slice(start, lengths[index+1]);
        });

        // This will create the function that, on each, call, returns the next chunk.

        const fetcher = chunks.reduce((previousFunction, currentChunk)=>
            previousFunction.mockReturnValueOnce(Promise.resolve(makeCollection(currentChunk, totalCount))), 
            jest.fn()
        );
        
        const { result } = renderHook((_fetcher: Fetcher)=>useSerializedCollection(_fetcher), {
            initialProps: fetcher
        });

        // The promise chain is susceptible to race conditions, so this needs to be done.
        await waitFor(()=>{
            expect(result.current?.at(0)).toBeDefined();
            // This needs to be done before verifying the collection
            if (result.current?.at(0) !== undefined){
                // Need to do this because the result can be undefined at this before.
                assertRecordLength(result.current?.at(0), lengths[1]);
            }
            
        }
        );

        verifyCollections(makeCollection(chunks[0], totalCount), result.current?.at(0));
        expect(fetcher).toBeCalledTimes(1);

        await act(async ()=>{
            await typeCastCall(result.current?.at(2));
        });

        await waitFor(()=>{
            assertRecordLength(result.current?.at(0), lengths[2]);
        });

        verifyCollections(makeCollection([...chunks[0], ...chunks[1]], totalCount), result.current?.at(0));
        expect(fetcher).toBeCalledTimes(2);

        await act(async ()=>{
            await typeCastCall(result.current?.at(2));
        });

        await waitFor(()=>{
            assertRecordLength(result.current?.at(0), lengths[3]);
        });

        verifyCollections(makeCollection([...chunks[0], ...chunks[1], ...chunks[2]], totalCount), result.current?.at(0));
        expect(fetcher).toBeCalledTimes(3);

        // This call should never even happen.
        await act(async ()=>{
            await typeCastCall(result.current?.at(2));
        });

        expect(fetcher).toBeCalledTimes(3);


    });

    }
)