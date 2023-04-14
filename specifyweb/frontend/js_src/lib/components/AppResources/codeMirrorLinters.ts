import { jsonParseLinter } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { linter } from '@codemirror/lint';
import type { Extension, Text } from '@codemirror/state';
import type { EditorView } from 'codemirror';

import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { mappedFind } from '../../utils/utils';
import { consoleLog } from '../Errors/interceptLogs';
import type { LogPathPart } from '../Errors/logContext';
import { getLogContext, pathKey, setLogContext } from '../Errors/logContext';
import type { BaseSpec } from '../Syncer';
import { findNodePosition } from '../Syncer/findNodePosition';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../Syncer/xmlToJson';

export const createLinter =
  (handler: (view: EditorView) => RA<Diagnostic>) =>
  (handleChange: (results: RA<Diagnostic>) => void): Extension =>
    linter((view) => {
      const results = handler(view);
      handleChange(results);
      return results;
    });

export const xmlLinter = (
  spec: BaseSpec<SimpleXmlNode> | undefined
): ReturnType<typeof createLinter> =>
  createLinter(({ state }) => {
    const string = state.doc.toString();
    const parsed = parseXml(string);
    return typeof parsed === 'string'
      ? [formatXmlError(state.doc, parsed)]
      : typeof spec === 'object'
      ? parseXmlUsingSpec(spec, parsed, string)
      : [];
  });

function parseXmlUsingSpec(
  spec: BaseSpec<SimpleXmlNode>,
  xml: Element,
  string: string
): RA<Diagnostic> {
  const parsed = xmlToJson(xml);
  const simple = toSimpleXmlNode(parsed);
  const { serializer } = syncers.object(spec);

  const logContext = getLogContext();
  const logIndexBefore = consoleLog.length;
  serializer(simple);
  const errors = consoleLog.slice(logIndexBefore);
  setLogContext(logContext);

  return filterArray(
    errors.map(({ context, type, message }) =>
      Array.isArray(context[pathKey])
        ? {
            severity:
              type === 'error' ? 'error' : type === 'warn' ? 'warning' : 'info',
            message: message
              .map((part) => (part as number).toString())
              .join('\n'),
            ...findNodePosition(string, context[pathKey] as RA<LogPathPart>),
          }
        : undefined
    )
  );
}

export const jsonLinter = createLinter(jsonParseLinter());

export function parseXml(string: string): Element | string {
  const parsedXml = new window.DOMParser().parseFromString(
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

export function strictParseXml(xml: string): Element {
  const parsed = parseXml(xml);
  // eslint-disable-next-line functional/no-throw-statement
  if (typeof parsed === 'string') throw new Error(parsed);
  else return parsed;
}

const xmlErrorParsers = [
  /(?<message>[^\n]+)\n[^\n]+\nLine Number (?<line>\d+), Column (?<column>\d+)/u,
  /error on line (?<line>\d+) at column (?<column>\d+): (?<message>[\s\S]*)/u,
];

const formatXmlError = (text: Text, error: string): Diagnostic =>
  mappedFind(xmlErrorParsers, (regex) => {
    const groups = regex.exec(error)?.groups;
    if (groups === undefined) return undefined;
    const { line, column, message } = groups;
    const lineDescriptor = text.line(Number.parseInt(line));
    const position = lineDescriptor.from - 1 + Number.parseInt(column);
    return {
      from: position,
      to: position,
      severity: 'error',
      message,
    };
  }) ?? { from: 0, to: 0, severity: 'error', message: error };
