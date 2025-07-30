import { render } from "@testing-library/react";
import { requireContext } from "../../../tests/helpers";
import { exportsForTests } from "../Tabs";
import React from "react";
import { testAppResources } from "./testAppResources";

const { OtherCollectionWarning } = exportsForTests;

requireContext();


describe("OtherCollectionWarning", () => {

    test('(no collection, no discipline)', () => {

        const { asFragment } = render(
            <OtherCollectionWarning directory={testAppResources.directories[0]} />
        );
        expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
    });

    test('(same collection)', () => {

        const { asFragment } = render(
            <OtherCollectionWarning directory={testAppResources.directories[2]} />
        );
        expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
    });

    test('(no collection, same discipline)', () => {

        const { asFragment } = render(
            <OtherCollectionWarning directory={{ ...testAppResources.directories[2], collection: null }} />
        );
        expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
    });

    test('(different collection, same discipline)', () => {

        const { asFragment } = render(
            <OtherCollectionWarning directory={{ ...testAppResources.directories[2], collection: '/api/specify/collection/909/' }} />
        );
        expect(asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div
    class="flex flex-col gap-2 p-2 text-white bg-orange-500 dark:bg-transparent border border-orange-500 rounded"
    role="alert"
  >
    This resource belongs to a different collection/discipline than the one you are currently in. It's recommended to switch collection before editing this resource
  </div>
</DocumentFragment>
`);
    });

    test('(no collection, different discipline)', () => {

        const { asFragment } = render(
            <OtherCollectionWarning directory={{ ...testAppResources.directories[2], discipline: '/api/specify/discipline/909/', collection: null }} />
        );
        expect(asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div
    class="flex flex-col gap-2 p-2 text-white bg-orange-500 dark:bg-transparent border border-orange-500 rounded"
    role="alert"
  >
    This resource belongs to a different collection/discipline than the one you are currently in. It's recommended to switch collection before editing this resource
  </div>
</DocumentFragment>
`);
    });
})