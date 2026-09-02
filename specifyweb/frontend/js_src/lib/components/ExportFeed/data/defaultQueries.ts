export const defaultQueries = {
  core: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
  <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <queries>
      <query name="core.csv" contextTableId="1">
        <id stringId="guid" oper="0" value="" isNot="false" isRelFld="false" term="http://rs.tdwg.org/dwc/terms/occurrenceID" />
        <field stringId="catalogNumber" oper="0" value="" isNot="false" isRelFld="false" term="http://rs.tdwg.org/dwc/terms/catalogNumber" />
        <field stringId="objectGuid" oper="0" value="" isNot="false" isRelFld="false" term="http://rs.tdwg.org/dwc/terms/recordedBy" />
      </query>
    </queries>
    <id index="0" />
  </core>
</archive>`,
  Multimedia: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
  <extension rowType="http://rs.gbif.org/terms/1.0/Multimedia">
    <queries>
      <query name="Multimedia.csv" contextTableId="1">
        <id stringId="collectionObjectId" oper="0" value="" isNot="false" isRelFld="false" term="http://purl.org/dc/terms/identifier" />
        <field stringId="catalogNumber" oper="0" value="" isNot="false" isRelFld="false" term="http://purl.org/dc/terms/title" />
      </query>
    </queries>
    <coreid index="0" />
  </extension>
</archive>`,
  MeasurementOrFacts: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
  <extension rowType="http://rs.gbif.org/terms/1.0/MeasurementOrFacts">
    <queries>
      <query name="MeasurementOrFacts.csv" contextTableId="1">
        <id stringId="collectionObjectId" oper="0" value="" isNot="false" isRelFld="false" term="http://rs.tdwg.org/dwc/terms/occurrenceID" />
        <field stringId="catalogNumber" oper="0" value="" isNot="false" isRelFld="false" term="http://rs.tdwg.org/dwc/terms/measurementType" />
      </query>
    </queries>
    <coreid index="0" />
  </extension>
</archive>`,
} as const;
