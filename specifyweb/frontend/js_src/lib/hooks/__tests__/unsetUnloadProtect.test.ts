import type { RA } from "../../utils/types";
import { localized } from "../../utils/types"
import { unsetUnloadProtect } from "../navigation";

describe("unsetUnloadProtect", ()=>{
    test("removes error message", ()=>{
        let errorMessages: RA<string> = ["custom error message",  "custom error message 2 (should not be removed)"];
        const setUnloadProtects = (generator: RA<string> | ((old: RA<string>) => RA<string>)) => {
            errorMessages = typeof generator === 'function' ? generator(errorMessages) : generator;
        }
        unsetUnloadProtect(setUnloadProtects, localized("custom error message"));
        expect(errorMessages).toEqual(["custom error message 2 (should not be removed)"]);
    });

    test("returns same unload protects if message not found", ()=>{
        let errorMessages: RA<string> = ["custom error message",  "custom error message 2 (should not be removed)"];
        const setUnloadProtects = (generator: RA<string> | ((old: RA<string>) => RA<string>)) => {
            errorMessages = typeof generator === 'function' ? generator(errorMessages) : generator;
        }
        unsetUnloadProtect(setUnloadProtects, localized("custom error message, does not exist"));
        expect(errorMessages).toEqual(["custom error message",  "custom error message 2 (should not be removed)"]); 
    });
})