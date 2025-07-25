import { renderHook } from "@testing-library/react";
import { exportsForTests } from "../Aside";

const { useOpenCurrent } = exportsForTests;


describe('useOpenCurrent', ()=>{

    test("no conformation no tree", ()=>{
        const setConformation = jest.fn();

        renderHook(()=>useOpenCurrent([], setConformation, []));
        expect(setConformation).toBeCalledTimes(1);
        expect(setConformation.mock.lastCall).toEqual([[]]);

    });

});