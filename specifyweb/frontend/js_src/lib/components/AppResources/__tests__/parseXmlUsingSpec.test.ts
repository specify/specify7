
import { requireContext } from "../../../tests/helpers";
import { interceptLogs } from "../../Errors/interceptLogs";
import { pipe } from "../../Syncer";
import { syncers } from "../../Syncer/syncers";
import { createXmlSpec } from "../../Syncer/xmlUtils";
import { exportsForTests } from "../codeMirrorLinters";
import { strictParseXml } from "../parseXml";

const { parseXmlUsingSpec } = exportsForTests;

requireContext();

describe("parseXmlUsingSpec", ()=>{

    const xmlSpec = createXmlSpec({
        content: pipe(
            syncers.xmlChild('singleChild'),
            syncers.xmlAttribute('class', 'required'),
            syncers.maybe(syncers.javaClassName())
        )
    });


    test("correct XML", ()=>{
        const xmlString = `
            <content>
            <singleChild class="edu.ku.brc.specify.datamodel.Accession">
            </singleChild>
            </content>
        `;

        const element = strictParseXml(xmlString);
        interceptLogs();
        const output = parseXmlUsingSpec(xmlSpec, element, xmlString);
        expect(output).toEqual([])
    });

    test("incorrect XML (error)", ()=>{
        const xmlString = `
            <content>
            <singleChild class="edu.ku.brc.specify.datamodel.AccessionNAT">
            </singleChild>
            </content>
        `;

        const element = strictParseXml(xmlString);
        interceptLogs();
        const output = parseXmlUsingSpec(xmlSpec, element, xmlString);
        expect(output).toEqual([
            {
                severity: 'error',
                message: 'Unknown table: AccessionNAT',
                from: 48,
                to: 97
            }
        ]);

    });

    test("incorrect XML (warning)", ()=>{
        const xmlString = `
            <content>
            <singleChild class="edu.ku.brc.specify.datamodel.Accession">
            </singleChild>
            <singleChild class="edu.ku.brc.specify.datamodel.Accession">
            </singleChild>
            </content>
        `;

        const element = strictParseXml(xmlString);
        interceptLogs();
        const output = parseXmlUsingSpec(xmlSpec, element, xmlString);
        expect(output).toEqual([
            {
                severity: 'warning',
                message: 'Expected to find at most one <singleChild /> child',
                from: 35,
                to: 35
            }
        ]);
    });

    test("incorrect XML (warning + error)", ()=>{

        const xmlString = `
            <content>
            <singleChild class="edu.ku.brc.specify.datamodel.AccessionNAT">
            </singleChild>
            <singleChild class="edu.ku.brc.specify.datamodel.Accession">
            </singleChild>
            </content>
        `;

        const element = strictParseXml(xmlString);
        interceptLogs();
        const output = parseXmlUsingSpec(xmlSpec, element, xmlString);
        expect(output).toEqual([
            {
                severity: 'warning',
                message: 'Expected to find at most one <singleChild /> child',
                from: 35,
                to: 35
            },
            {
                severity: 'error',
                message: 'Unknown table: AccessionNAT',
                from: 48,
                to: 97
            }
        ]);
    
    });

});