import { renderHook } from "@testing-library/react";

import { userPreferences } from "../../components/Preferences/userPreferences";
import { useHueDifference } from "../useHueDifference";

describe("useHueDifference", ()=>{

    test("hue difference is correct", async ()=>{
        userPreferences.setRaw({'general': {appearance: {accentColor3: "#1a9cff"}}})
        const { result } = renderHook(()=>useHueDifference());
        expect(result.current).toBe(179);
    });

    test("hue difference is adjusted when difference is negative", async ()=>{
        userPreferences.setRaw({'general': {appearance: {accentColor3: '#ff1a1a'}}})
        const { result } = renderHook(()=>useHueDifference());
        expect(result.current).toBe(333);
    });

})