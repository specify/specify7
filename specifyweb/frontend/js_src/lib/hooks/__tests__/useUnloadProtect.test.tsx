import { LocalizedString } from "typesafe-i18n";
import { localized, RA } from "../../utils/types";
import { useUnloadProtect } from "../navigation";
import React from "react";
import { mount } from "../../tests/reactUtils";
import { SetUnloadProtectsContext } from "../../components/Router/UnloadProtect";
import { act } from "react-dom/test-utils";


describe("useUnloadProtect", () => {

    function TestUnloadProtect({ isEnabled, message }: { readonly isEnabled: boolean, readonly message: LocalizedString }) {
        useUnloadProtect(isEnabled, message);
        return <></>
    }

    test("unload protect gets set", () => {
        const message = localized("custom message");
        let unloadProtects: RA<string> = [];

        const onUnloadProtectSet = (newValue: RA<string> | ((old: RA<string>) => RA<string>)) => {
            unloadProtects = typeof newValue === 'function' ? newValue(unloadProtects) : newValue;
        }

        mount(
            <SetUnloadProtectsContext.Provider value={onUnloadProtectSet}>
                <TestUnloadProtect isEnabled message={message} />
            </SetUnloadProtectsContext.Provider>
        );

        expect(unloadProtects).toEqual([message]);

    });

    test("unload protect gets unset on message change", async () => {
        const initialMessage = localized("custom message");
        const newMessage = localized("new custom message");
        let unloadProtects: RA<string> = [];

        const onUnloadProtectSet = (newValue: RA<string> | ((old: RA<string>) => RA<string>)) => {
            unloadProtects = typeof newValue === 'function' ? newValue(unloadProtects) : newValue;
        }

        const { rerender } = mount(<SetUnloadProtectsContext.Provider value={onUnloadProtectSet}>
            <TestUnloadProtect isEnabled message={initialMessage} />
        </SetUnloadProtectsContext.Provider>);

        expect(unloadProtects).toEqual([initialMessage]);

        await act(() => rerender(
            <SetUnloadProtectsContext.Provider value={onUnloadProtectSet}>
                <TestUnloadProtect isEnabled message={newMessage} />
            </SetUnloadProtectsContext.Provider>
        ))

        expect(unloadProtects).toEqual([newMessage]);
    });

    test("unload protect gets unset on disable change", async () => {
        const initialMessage = localized("custom message");

        let unloadProtects: RA<string> = [];

        const onUnloadProtectSet = (newValue: RA<string> | ((old: RA<string>) => RA<string>)) => {
            unloadProtects = typeof newValue === 'function' ? newValue(unloadProtects) : newValue;
        }

        const { rerender } = mount(<SetUnloadProtectsContext.Provider value={onUnloadProtectSet}>
            <TestUnloadProtect isEnabled message={initialMessage} />
        </SetUnloadProtectsContext.Provider>);

        expect(unloadProtects).toEqual([initialMessage]);

        await act(() => rerender(
            <SetUnloadProtectsContext.Provider value={onUnloadProtectSet}>
                <TestUnloadProtect isEnabled={false} message={initialMessage} />
            </SetUnloadProtectsContext.Provider>
        ))

        expect(unloadProtects).toEqual([]);
    });
})