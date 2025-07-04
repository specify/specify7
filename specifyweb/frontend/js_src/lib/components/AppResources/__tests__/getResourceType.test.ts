import { requireContext } from "../../../tests/helpers";
import { addMissingFields } from "../../DataModel/addMissingFields";
import { getAppResourceType, getResourceType } from "../filtersHelpers";
import { staticAppResources } from "./staticAppResources";

requireContext();

const testAppResources = [
    {
    name: 'preferences',
    mimeType: null,
    expectedType: 'otherPropertiesResource'
    },
    {
    name: 'QueryFreqList',
    mimeType: 'text/xml',
    expectedType: 'otherXmlResource'
    },
    {
    name: 'QueryExtraList',
    mimeType: 'text/xml',
    expectedType: 'otherXmlResource'
    },
    {
    name: 'ExpressSearchConfig',
    mimeType: 'text/xml',
    expectedType: 'expressSearchConfig'
    },
    { name: 'WebLinks', mimeType: 'text/xml', expectedType: 'webLinks' },
    {
    name: 'DataObjFormatters',
    mimeType: 'text/xml',
    expectedType: 'dataObjectFormatters'
    },
    {
    name: 'DataEntryTaskInit',
    mimeType: 'text/xml',
    expectedType: 'dataEntryTables'
    },
    {
    name: 'Number Tags',
    mimeType: 'jrxml/label',
    expectedType: 'label'
    },
    {
    name: 'Fish Loan Report',
    mimeType: 'jrxml/report',
    expectedType: 'report'
    },
    {
    name: 'Tissue Gift Report',
    mimeType: 'jrxml/report',
    expectedType: 'report'
    },
    {
    name: 'Fish Gift Report',
    mimeType: 'jrxml/report',
    expectedType: 'report'
    },
    {
    name: 'Loan Shipping Form',
    mimeType: 'jrxml/report',
    expectedType: 'report'
    },
    {
    name: 'Gift Shipping Form',
    mimeType: 'jrxml/report',
    expectedType: 'report'
    },
    {
    name: 'Datamax Jar Labels',
    mimeType: 'jrxml/label',
    expectedType: 'label'
    },
    {
    name: 'TypeSearches',
    mimeType: 'text/xml',
    expectedType: 'typeSearches'
    },
    {
    name: 'UIFormatters',
    mimeType: 'text/xml',
    expectedType: 'uiFormatters'
    },
    {
    name: 'Teaching labels',
    mimeType: 'jrxml/label',
    expectedType: 'label'
    },
    {
    name: 'UserPreferences',
    mimeType: 'application/json',
    expectedType: 'userPreferences'
    },
    {
    name: 'CollectionPreferences',
    mimeType: 'application/json',
    expectedType: 'collectionPreferences'
    },
    {
    name: 'DefaultUserPreferences',
    mimeType: 'application/json',
    expectedType: 'defaultUserPreferences'
    }
]

describe("getResourceType", ()=>{

    test("viewset type", ()=>{
        expect(getResourceType(staticAppResources.viewSets[0])).toBe('viewSet');
    });

    test("appresource type", ()=>{
        testAppResources.forEach(({expectedType, ...partialResource})=>{
            expect(getResourceType(addMissingFields("SpAppResource", partialResource))).toBe(expectedType);
        });
    });

});

describe("getAppResourceType", ()=>{

    test("returned type matches expected", ()=>{
        testAppResources.forEach(({expectedType, ...partialResource})=>{
            expect(getAppResourceType(addMissingFields("SpAppResource", partialResource))).toBe(expectedType);
        });
    });
});

