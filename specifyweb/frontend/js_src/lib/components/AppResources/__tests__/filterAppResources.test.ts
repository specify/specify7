import { defaultAppResourceFilters, filterAppResources } from "../filtersHelpers";
import { staticAppResources } from "./staticAppResources";

describe("filterAppResources", ()=>{

    test("case: no appResources filter", ()=>{
        const filteredResourcesNoViews = filterAppResources(staticAppResources, {
            appResources: [],
            viewSets: true
        });

        expect(filteredResourcesNoViews).toEqual({
            ...staticAppResources,
            appResources: []
            }
        )
    });

    test("case: no views filter", ()=>{
        const filteredResourcesNoAppResources = filterAppResources(staticAppResources, {
            ...defaultAppResourceFilters,
            viewSets: false
        });

        expect(filteredResourcesNoAppResources).toEqual({
            ...staticAppResources,
            viewSets: []    
            }
        )
    });

    test("case: default filter", ()=>{
        const defaultFiltered = filterAppResources(staticAppResources, defaultAppResourceFilters);

        expect(defaultFiltered).toEqual(staticAppResources);
    });

    test("case: filtered app resources", ()=>{

        const filter = {
            ...defaultAppResourceFilters,
            appResources: defaultAppResourceFilters.appResources.filter((type)=>type !== 'otherXmlResource')
        }

        const expectedResources = {
            ...staticAppResources,
            appResources: staticAppResources.appResources.slice(1)
        }

        expect(filterAppResources(staticAppResources, filter)).toEqual(
            expectedResources
        );

    });
});