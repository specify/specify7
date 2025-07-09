import { EditorView } from 'codemirror';

import { exportsForTests } from '../codeMirrorLinters';

const { formatXmlError } = exportsForTests;

describe('formatXmlError', () => {
  const view = new EditorView({
    doc: 'TestString\nSomeValueIsNotNever',
  });

  // These are generic errors (not necessarily coming from XML editor)
  test('regex matched errors', () => {
    // This matches xmlErrorParsers[0]
    const firstReError = [
      'First two letters should be Ab',
      'Ignore this',
      'Line Number 1, Column 1',
    ];

    // This matches xmlErrorParsers[1]
    const secondReError =
      'error on line 1 at column 15: "Never" is not allowed';

    const diagnostic = formatXmlError(view.state.doc, firstReError.join('\n'));
    expect(diagnostic).toEqual({
      from: 0,
      to: 0,
      severity: 'error',
      message: 'First two letters should be Ab',
    });

    const secondDiagnostic = formatXmlError(view.state.doc, secondReError);
    expect(secondDiagnostic).toEqual({
      from: 14,
      to: 14,
      severity: 'error',
      message: '"Never" is not allowed',
    });
  });

  test('unmatched errors', () => {
    const diagnostic = formatXmlError(
      view.state.doc,
      'Camel case is not allowed'
    );
    expect(diagnostic).toEqual({
      from: 0,
      to: 0,
      severity: 'error',
      message: 'Camel case is not allowed',
    });
  });
});
