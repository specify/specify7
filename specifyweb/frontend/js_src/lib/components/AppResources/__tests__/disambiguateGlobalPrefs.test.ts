import { resourcesText } from "../../../localization/resources";
import { replaceItem } from "../../../utils/utils";
import { getResourceApiUrl } from "../../DataModel/resource";
import { AppResourcesTree } from "../hooks";
import { exportsForTests } from "../tree";
import { staticAppResources } from "./staticAppResources";

const { disambiguateGlobalPrefs } = exportsForTests;

describe("disambiguateGlobalPrefs", ()=>{

    test("no preference app resources", ()=>{
        const appResources = ([0, 2]).map((index)=>staticAppResources.appResources[index]);
        expect(disambiguateGlobalPrefs(appResources, staticAppResources.directories)).toEqual(
            appResources
        );
    });

    test("preference app resources (global prefs)", ()=>{

        expect(disambiguateGlobalPrefs(staticAppResources.appResources, staticAppResources.directories)).toEqual(
            replaceItem(
                staticAppResources.appResources as AppResourcesTree[number]['appResources'],
                1, 
                {
                    ...staticAppResources.appResources[1],
                    label: resourcesText.globalPreferences()
                }
            )
        );

    });

    test("preference app resources (remote prefs)", ()=>{

        const directories = [
            {
                ...staticAppResources.directories[0],
                userType: "Prefs"
            },
            staticAppResources.directories[1]
        ];

        expect(disambiguateGlobalPrefs(staticAppResources.appResources, directories)).toEqual(
            replaceItem(
                staticAppResources.appResources as AppResourcesTree[number]['appResources'],
                1, 
                {
                    ...staticAppResources.appResources[1],
                    label: resourcesText.remotePreferences()
                }
            )
        );
    });

    test("preference app resources (unmatched usertype)", ()=>{
        const directories = [
            {
                ...staticAppResources.directories[0],
                userType: "Common"
            },
            staticAppResources.directories[1]
        ];

        expect(disambiguateGlobalPrefs(staticAppResources.appResources, directories)).toEqual(
            staticAppResources.appResources as AppResourcesTree[number]['appResources']
        );

    });

    test("preference app resources (unmatched spappresourcedir)", ()=>{
        const appResources = staticAppResources.appResources.map(
            (resource)=>({...resource, spAppResourceDir: getResourceApiUrl("SpAppResourceDir", 4)})
        );

        expect(disambiguateGlobalPrefs(appResources, staticAppResources.directories)).toEqual(
            appResources
        );

    });

});