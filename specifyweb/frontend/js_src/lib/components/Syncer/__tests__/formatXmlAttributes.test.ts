import { theories } from '../../../tests/utils';
import { formatXmlAttributes } from '../formatXmlAttributes';

theories(formatXmlAttributes, [
  {
    name: 'Split attributes into multiple lines',
    in: [
      `<br />
  <format name="Accession" title="Accession" class="edu.ku.brc.specify.datamodel.Accession" abc="" default="true"></format>`,
    ],
    out: `<br />
  <format
    name="Accession"
    title="Accession"
    class="edu.ku.brc.specify.datamodel.Accession"
    abc=""
    default="true"
  ></format>`,
  },
  {
    name: 'Handles children and comments',
    in: [
      `<br />
  <format name="Accession" title="Accession" class="edu.ku.brc.specify.datamodel.Accession" default="true">
    <switch name="Accession" title="Accession" abc="def" />
    <!-- <switch name="Accession" title="Accession" abc="def" /> -->
  </format>`,
    ],
    out: `<br />
  <format
    name="Accession"
    title="Accession"
    class="edu.ku.brc.specify.datamodel.Accession"
    default="true"
  >
    <switch name="Accession" title="Accession" abc="def" />
    <!-- <switch name="Accession" title="Accession" abc="def" /> -->
  </format>`,
  },
  {
    name: 'Only long lines are formatted',
    in: ['<br />\n  <format name="Accession" title="Accession"></format>'],
    out: '<br />\n  <format name="Accession" title="Accession"></format>',
  },
]);
