import { parseXml, strictParseXml } from "../parseXml";

describe("parseXml", ()=>{

    const validXmlString = "<top><body>'this is valid!'</body></top>";
    const invalidXmlString = "<top><body></top>";

    test("valid XML", ()=>{
        
        const result = parseXml(validXmlString) as Element;
        expect(result.outerHTML).toBe(validXmlString);
    });

    test("valid XML (strict)", ()=>{
        // Test the strict version.
        const strictResult = strictParseXml(validXmlString);
        expect(strictResult.outerHTML).toBe(validXmlString);
    });

    test("invalid XML", ()=>{
        const result = parseXml(invalidXmlString);
        // If it is string, then it was invalid.
        expect(typeof result).toBe("string");
    });

    test("invalid XML (strict)", ()=>{
        expect(()=>strictParseXml(invalidXmlString)).toThrow();
    });
});