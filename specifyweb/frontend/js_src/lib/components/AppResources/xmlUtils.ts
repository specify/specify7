// shared utilities for XML manipulation in AppResources
export const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// replace the viewset name attribute in XML content
export const replaceViewsetNameInXml = (
  data: string | null | undefined,
  resourceName: string
): string => {
  const xml = data ?? '';
  if (typeof resourceName !== 'string' || resourceName.length === 0)
    return xml;
  return xml.replace(
    /(<viewset\b[^>]*\bname=)([\"])(.*?)\2/,
    (_match, prefix, quote) => `${prefix}${quote}${escapeXml(resourceName)}${quote}`
  );
};


