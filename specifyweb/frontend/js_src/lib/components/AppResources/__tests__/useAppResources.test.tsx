import { render } from "@testing-library/react";
import React from "react";
import { act } from "react-dom/test-utils";

import { overrideAjax } from "../../../tests/ajax";
import { requireContext } from "../../../tests/helpers";
import type { GetOrSet, RA } from "../../../utils/types";
import type { AppResources} from "../hooks";
import { useAppResources } from "../hooks";
import { staticAppResources } from "./staticAppResources";

requireContext();

describe("useAppResources", () => {

    const makeCollection = (resources: RA<unknown>) => ({
        objects: resources,
        meta: {
            limit: 0,
            offset: 0,
            total_count: resources.length
        }
    });

    overrideAjax("/api/specify/spappresourcedir/?limit=0", makeCollection(staticAppResources.directories));
    overrideAjax("/api/specify/discipline/?limit=0", makeCollection(staticAppResources.disciplines));
    overrideAjax("/api/specify/collection/?limit=0", makeCollection(staticAppResources.collections));
    overrideAjax("/api/specify/specifyuser/?limit=0", makeCollection(staticAppResources.users));
    overrideAjax("/api/specify/spappresource/?limit=0", makeCollection(staticAppResources.appResources));
    overrideAjax("/api/specify/spviewsetobj/?limit=0", makeCollection(staticAppResources.viewSets));

    function TestComponent({ onSet: handleSet }: { readonly onSet: (value: GetOrSet<AppResources | undefined>) => void }) {
        const result = useAppResources(false);
        React.useEffect(() => {
            handleSet(result);
        }, [result[0], result[1]]);
        return <></>
    }

    test.skip("no loading screen", async () => {

        act(() => {
            render(
                <TestComponent onSet={jest.fn()} />
            );
        })

    });
})
