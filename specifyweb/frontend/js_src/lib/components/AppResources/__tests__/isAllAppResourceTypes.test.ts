import { isAllAppResourceTypes } from "../filtersHelpers";
import { appResourceSubTypes } from "../types";

describe("isAllAppResourceTypes", ()=>{

    const types = Object.keys(appResourceSubTypes);

    test("all app resources case", ()=>{
        expect(isAllAppResourceTypes(types)).toBe(true);
    });

    test("missing app resources case", ()=>{
        expect(isAllAppResourceTypes(types.slice(1, -2))).toBe(false);
    });
});