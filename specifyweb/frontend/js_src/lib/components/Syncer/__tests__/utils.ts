/**
 * Make snapshots more readable
 */
export const formatXmlForTests = (xml: string): string =>
  xml.replaceAll('\t', '  ').replaceAll('"', "'");
