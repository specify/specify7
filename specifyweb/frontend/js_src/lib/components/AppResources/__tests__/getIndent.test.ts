import { userPreferences } from "../../Preferences/userPreferences";
import { getIndent } from "../EditorComponents";

describe("getIndent", ()=>{
    
    test('simple get', ()=>{
        expect(getIndent()).toMatchInlineSnapshot(`"  "`);
    });

    test('set and then get', ()=>{
        userPreferences.set('appResources', 'behavior', 'indentSize', 4);
        userPreferences.set('appResources', 'behavior', 'indentWithTab', false);
        expect(getIndent()).toMatchInlineSnapshot(`"    "`);
    });

})