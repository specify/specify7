export const testFormDefinition = `
    <desc><![CDATA[The Accession form.]]></desc>
    <enableRules/>
    <columnDef>100px,2px,175px,5px,140px,2px,161px,5px,75px,2px,160px,0px,15px,p:g</columnDef>
    <columnDef os="lnx">115px,2px,185px,5px,160px,2px,180px,5px,105px,2px,156px,0px,15px,p:g</columnDef>
    <columnDef os="mac">130px,2px,205px,5px,180px,2px,200px,5px,125px,2px,176px,0px,15px,p:g</columnDef>
    <columnDef os="exp">p,2px,p:g,5px:g,p,2px,p:g,5px:g,p,2px,p:g,0px,p,p:g</columnDef>
    <rowDef auto="true" cell="p" sep="1px"/>
    <rows>
      <row>
        <!-- <cell type="label" labelfor="1"/> -->
        <cell type="field" id="1" name="accessionNumber" uitype="formattedtext"/>
        <cell type="label" labelfor="2"/>
        <cell type="field" id="2" name="status"  uitype="combobox"/>
        <cell type="label" labelfor="3"/>
        <cell type="field" id="3" name="type" uitype="combobox" />
      </row>
      <row>
        <cell type="label" labelfor="12"/>
        <cell type="field" id="12" name="dateAccessioned" uitype="formattedtext" uifieldformatter="Date" default="today"/>
        <cell type="label" labelfor="6"/>
        <cell type="field" id="6" name="dateReceived" uitype="formattedtext" uifieldformatter="Date" default="today" />
      </row>
    </rows>
`;
