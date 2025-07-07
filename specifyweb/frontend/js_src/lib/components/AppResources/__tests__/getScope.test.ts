import { requireContext } from "../../../tests/helpers";
import { addMissingFields } from "../../DataModel/addMissingFields";
import { SerializedResource } from "../../DataModel/helperTypes";
import { getResourceApiUrl } from "../../DataModel/resource";
import { SpAppResourceDir } from "../../DataModel/types";
import { getScope } from "../tree";

requireContext();

const scopes = [
    {discipline: null, collection: null, userType: null, isPersonal: undefined, _expected: 'global'},
    {discipline: getResourceApiUrl('Discipline', 1), _expected: 'discipline'},
    {collection: getResourceApiUrl('Collection', 2), isPersonal: false, _expected: 'collection'},
    {isPersonal: true,  _expected: 'user'},
    {isPersonal: false, userType: 'Manager', _expected: 'userType'}
] as const;

test("get scope", ()=>{

    scopes.reduce((resource, {_expected, ...partialResource})=>{
        const rawResource = addMissingFields('SpAppResourceDir', {});
        const attributes = {...rawResource, ...resource, ...partialResource} as SerializedResource<SpAppResourceDir>;

        expect(getScope(attributes)).toBe(_expected);
        return attributes;
    }, {})

});