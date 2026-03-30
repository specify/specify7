import React from 'react';
import { Label } from '../Atoms/Form';
import { darwinCoreText } from '../../localization/DwC';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';



export function DwCSection({

}: {

}): JSX.Element {
    const [isOpen, _, __, handleOpen] = useBooleanState(false);

    const jsonTerms = {
    "dwc": {
        "desc": "Darwin Core",
        "abbreviation": "dwc",
        "vocabularyURI": "http://rs.tdwg.org/dwc/terms/",
        "lastUpdated": "2023-09-18",
        "terms": [
            {"http://rs.tdwg.org/dwc/terms/eventDate": 
                {
                    "name": "Event Date", 
                    "mappingPath": "table:collectionObject → field:startDateOrEndDate", 
                    "description": "The date-time or interval during which a dwc:Event occurred. For occurrences, this is the date-time when the dwc:Event was recorded. Not suitable for a time in a geological context.", 
                    "termName": "eventDate"
                }
            },
            {"http://rs.tdwg.org/dwc/terms/basisOfRecord": {"name": "Basis Of Record", "mappingPath": "table:collectionObject → field:basisOfRecord", "description": "The specific nature of the data record.", "termName": "basisOfRecord"}},
            {"http://rs.tdwg.org/dwc/terms/scientificName": {"name": "Scientific Name", "mappingPath": "table:collectionObject → field:fullName", "description": "The full scientific name, with authorship and date information if known. When forming part of a dwc:Identification, this should be the name in lowest level taxonomic rank that can be determined. This term should not contain identification qualifications, which should instead be supplied in the dwc:identificationQualifier term.", "termName": "scientificName"}},
            {"http://rs.tdwg.org/dwc/terms/occurrenceID": {"name": "Occurrence ID", "mappingPath": "table:collectionObject → field:guid", "description": "An identifier for the dwc:Occurrence (as opposed to a particular digital record of the dwc:Occurrence). In the absence of a persistent global unique identifier, construct one from a combination of identifiers in the record that will most closely make the dwc:occurrenceID globally unique.", "termName": "occurrenceId"}}
        ]
    }
}
const terms = jsonTerms.dwc.terms;

    return(
        <div className='flex flex-col'>
            <div className='flex'>
            <Label.Block>
                {darwinCoreText.darwinCore()}
            </Label.Block>
            <Button.Icon
                className={`ml-1`}
                icon={isOpen ? 'chevronDown' : 'chevronRight'}
                title="collapse"
                onClick={handleOpen}
            />
            </div>

            {isOpen && 
                <div className="space-y-4">
                    {terms.map((termObj, index) => {
                    const iri = Object.keys(termObj)[0];
                    const term = termObj[iri];

                    return (
                        <div
                        key={index}
                        className="p-3"
                        >
                        {/* Term name */}
                        <div className="mb-2">
                            <span className="text-sm font-semibold mr-2">Term:</span>
                            <span className="inline-block px-2 py-1 text-sm bg-gray-200 rounded-md text-brand-300">
                            {term.termName}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="text-sm mb-1">
                            <span className="font-semibold">Description:</span>{" "}
                            {term.description}
                        </div>

                        {/* IRI */}
                        <div className="text-sm mb-1 mt-2">
                            <span className="font-semibold">IRI:</span>
                            <Link.NewTab href={iri} className='ml-1'>
                            {iri}
                            </Link.NewTab>
                        </div>

                        {/* Vocabulary */}
                        <div className="text-sm mt-2">
                            <span className="font-semibold">Vocabulary:</span>{" "}
                            {jsonTerms.dwc.vocabularyURI}
                        </div>
                        </div>
                    );
                    })}
                </div>
            }
        </div>
        
        )
}