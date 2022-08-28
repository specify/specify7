import { jsonParseLinter } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { linter } from '@codemirror/lint';
import type { Extension, Text } from '@codemirror/state';
import type { EditorView } from 'codemirror';

import { mappedFind } from '../../utils/utils';
import type { RA } from '../../utils/types';

export const createLinter =
  (handler: (view: EditorView) => RA<Diagnostic>) =>
  (handleChange: (results: RA<Diagnostic>) => void): Extension =>
    linter((view) => {
      const results = handler(view);
      handleChange(results);
      return results;
    });

export const xmlLinter = createLinter(({ state }) => {
  const parsed = parseXml(state.doc.toString());
  return typeof parsed === 'string' ? [formatXmlError(state.doc, parsed)] : [];
});

export const jsonLinter = createLinter(jsonParseLinter());

export function parseXml(string: string): Document | string {
  const parsedXml = new window.DOMParser().parseFromString(string, 'text/xml');

  // Chrome, Safari
  const parseError =
    parsedXml.documentElement.getElementsByTagName('parsererror')[0];
  if (typeof parseError === 'object')
    return (parseError.children[1].textContent ?? parseError.innerHTML).trim();
  // Firefox
  else if (parsedXml.documentElement.tagName === 'parsererror')
    return (
      parsedXml.documentElement.childNodes[0].nodeValue ??
      parsedXml.documentElement.textContent ??
      parsedXml.documentElement.innerHTML
    ).trim();
  else return parsedXml;
}

const xmlErrorParsers = [
  /(?<message>[^\n]+)\n[^\n]+\nLine Number (?<line>\d+), Column (?<column>\d+)/,
  /error on line (?<line>\d+) at column (?<column>\d+): (?<message>[\s\S]*)*/,
];

const formatXmlError = (text: Text, error: string): Diagnostic =>
  mappedFind(xmlErrorParsers, (regex) => {
    const match = regex.exec(error);
    if (match === null) return undefined;
    const { line, column, message } = match.groups ?? {};
    const lineDescriptor = text.line(Number.parseInt(line));
    const position = lineDescriptor.from - 1 + Number.parseInt(column);
    return {
      from: position,
      to: position,
      severity: 'error',
      message,
    };
  }) ?? { from: 0, to: 0, severity: 'error', message: error };
