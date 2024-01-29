export function strictParseXml(xml: string): Element {
  const parsed = parseXml(xml);
  // eslint-disable-next-line functional/no-throw-statement
  if (typeof parsed === 'string') throw new Error(parsed);
  else return parsed;
}

export function parseXml(string: string): Element | string {
  const parsedXml = new globalThis.DOMParser().parseFromString(
    string,
    'text/xml'
  ).documentElement;

  // Chrome, Safari
  const parseError = parsedXml.getElementsByTagName('parsererror')[0];
  if (typeof parseError === 'object')
    return (parseError.children[1].textContent ?? parseError.innerHTML).trim();
  // Firefox
  else if (parsedXml.tagName === 'parsererror')
    return (
      parsedXml.childNodes[0].nodeValue ??
      parsedXml.textContent ??
      parsedXml.innerHTML
    ).trim();
  else return parsedXml;
}
