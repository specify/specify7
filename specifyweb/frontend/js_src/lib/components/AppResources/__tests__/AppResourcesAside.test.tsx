import { render } from "@testing-library/react"
import { AppResourcesAside } from "../Aside"
import React from "react"
import { staticAppResources } from "./staticAppResources"

describe("AppResourcesAside", () => {

    test("simple no resources case", () => {

        const onOpen = jest.fn();
        const setConformations = jest.fn();

        render(<AppResourcesAside
            resources={staticAppResources}
            isEmbedded
            onOpen={onOpen}
            filters={undefined}
            conformations={[[], setConformations]}
        />);

    })
})