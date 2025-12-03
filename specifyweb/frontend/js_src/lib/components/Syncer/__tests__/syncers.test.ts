import { requireContext } from '../../../tests/helpers';
import type { RA, RR, WritableArray } from '../../../utils/types';
import { localized } from '../../../utils/types';
import { getField } from '../../DataModel/helpers';
import { FieldBase } from '../../DataModel/specifyField';
import { SpecifyTable } from '../../DataModel/specifyTable';
import { tables } from '../../DataModel/tables';
import { error } from '../../Errors/assert';
import type { LogPathPart } from '../../Errors/logContext';
import { getLogContext, pathKey, setLogContext } from '../../Errors/logContext';
import type { ExtractSyncer, Syncer, SyncerIn, SyncerOut } from '../index';
import { pipe } from '../index';
import { syncers } from '../syncers';
import { createSimpleXmlNode } from '../xmlToJson';
import { createXmlSpec } from '../xmlUtils';

requireContext();

const tests: {
  readonly [SYNCER in keyof typeof syncers]: RA<
    ((typeof syncers)[SYNCER] extends (
      ...args: RA<any>
    ) => Syncer<unknown, unknown>
      ? {
          readonly arguments:
            | Parameters<(typeof syncers)[SYNCER]>
            | (() => Parameters<(typeof syncers)[SYNCER]>);
        }
      : RR<never, never>) & {
      readonly in: SyncerIn<ExtractSyncer<(typeof syncers)[SYNCER]>>;
      readonly out:
        | SyncerOut<ExtractSyncer<(typeof syncers)[SYNCER]>>
        | (() => SyncerOut<ExtractSyncer<(typeof syncers)[SYNCER]>>);
      readonly newOut?:
        | SyncerOut<ExtractSyncer<(typeof syncers)[SYNCER]>>
        | (() => SyncerOut<ExtractSyncer<(typeof syncers)[SYNCER]>>);
      readonly final?: SyncerIn<ExtractSyncer<(typeof syncers)[SYNCER]>>;
      readonly logContext?: LogPathPart;
      readonly error?: RA<unknown>;
      readonly warn?: RA<unknown>;
    }
  >;
} = {
  xmlAttribute: [
    {
      arguments: ['name', 'required'],
      in: { ...createSimpleXmlNode(), attributes: { name: 'value' } },
      out: localized('value'),
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['name2', 'required'],
      in: { ...createSimpleXmlNode(), attributes: { name: 'value' } },
      out: undefined,
      final: { ...createSimpleXmlNode(), attributes: { name2: undefined } },
      error: [`Required attribute "name2" is missing`],
      logContext: { type: 'Attribute', attribute: 'name2' },
    },
    {
      arguments: ['name', 'skip'],
      in: { ...createSimpleXmlNode(), attributes: { name2: 'value' } },
      out: undefined,
      final: { ...createSimpleXmlNode(), attributes: { name: undefined } },
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['name', 'empty'],
      in: { ...createSimpleXmlNode(), attributes: { name2: 'value' } },
      out: undefined,
      final: { ...createSimpleXmlNode(), attributes: { name: '' } },
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['name', 'empty'],
      in: { ...createSimpleXmlNode(), attributes: { name: ' ' } },
      out: undefined,
      newOut: localized(' '),
      final: { ...createSimpleXmlNode(), attributes: { name: '' } },
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['name', 'empty', false],
      in: { ...createSimpleXmlNode(), attributes: { name: ' ' } },
      out: localized(' '),
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['name', 'empty', false],
      in: { ...createSimpleXmlNode(), attributes: { name: '' } },
      out: localized(''),
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['NAME 2', 'required'],
      in: { ...createSimpleXmlNode(), attributes: { 'name 2': '' } },
      out: undefined,
      final: { ...createSimpleXmlNode(), attributes: { 'name 2': undefined } },
      error: [`Required attribute "NAME 2" is empty`],
      logContext: { type: 'Attribute', attribute: 'NAME 2' },
    },
    {
      arguments: ['name', 'empty'],
      in: { ...createSimpleXmlNode(), attributes: { name: ' v\n' } },
      out: localized('v'),
      final: { ...createSimpleXmlNode(), attributes: { name: 'v' } },
      logContext: { type: 'Attribute', attribute: 'name' },
    },
    {
      arguments: ['name', 'empty', false],
      in: { ...createSimpleXmlNode(), attributes: { name: ' v\n' } },
      out: localized(' v\n'),
      logContext: { type: 'Attribute', attribute: 'name' },
    },
  ],

  xmlContent: [
    {
      in: { ...createSimpleXmlNode(), text: 'value ' },
      out: 'value',
      final: { ...createSimpleXmlNode(), text: 'value' },
      logContext: { type: 'Content' },
    },
    {
      in: {
        ...createSimpleXmlNode(),
        children: { v: [createSimpleXmlNode()] },
      },
      out: undefined,
      final: {
        ...createSimpleXmlNode(),
      },
      logContext: { type: 'Content' },
    },
  ],

  default: [
    {
      arguments: ['default'],
      in: 'value',
      out: 'value',
    },
    {
      arguments: [(): string => 'default'],
      in: undefined,
      out: 'default',
    },
    {
      arguments: ['default'],
      in: undefined,
      out: 'default',
      newOut: undefined,
      final: undefined,
    },
    {
      arguments: [(): undefined => undefined],
      in: undefined,
      out: undefined,
      final: undefined,
    },
  ],

  fallback: [
    {
      arguments: ['default'],
      in: 'value',
      out: 'value',
    },
    {
      arguments: [(): string => 'default'],
      in: undefined,
      out: 'default',
      final: 'default',
    },
    {
      arguments: ['default'],
      in: undefined,
      out: 'default',
      newOut: undefined,
      final: 'default',
    },
    {
      arguments: [(): undefined => undefined],
      in: undefined,
      out: undefined,
      final: undefined,
    },
  ],

  javaClassName: [
    {
      arguments: [],
      in: 'edu.ku.brc.specify.datamodel.Accession',
      out: () => tables.Accession,
    },
    {
      arguments: [],
      in: 'edu.ku.brc.specify.datamodel.Accessions',
      out: undefined,
      final: undefined,
      error: ['Unknown table: Accessions'],
    },
    {
      arguments: [true],
      in: undefined,
      out: undefined,
      error: ['Unknown table'],
    },
    {
      arguments: [],
      in: 'Accessions',
      out: undefined,
      final: undefined,
      error: ['Unknown table: Accessions'],
    },
    {
      arguments: [false],
      in: 'edu.ku.brc.specify.datamodel.Accessions',
      out: undefined,
      final: undefined,
      warn: ['Unknown table: Accessions'],
    },
    {
      arguments: [],
      in: 'Accession',
      out: () => tables.Accession,
      final: 'edu.ku.brc.specify.datamodel.Accession',
    },
  ],

  tableName: [
    {
      in: 'Accession',
      out: () => tables.Accession,
      final: 'Accession',
    },
    {
      in: 'Accessions',
      out: undefined,
      final: undefined,
      error: ['Unknown table: Accessions'],
    },
    {
      in: 'edu.ku.brc.specify.datamodel.Accession',
      out: () => tables.Accession,
      final: 'Accession',
    },
    {
      in: 'edu.ku.brc.specify.datamodel.Accessions',
      out: undefined,
      final: undefined,
      error: ['Unknown table: edu.ku.brc.specify.datamodel.Accessions'],
    },
    {
      in: undefined,
      out: undefined,
      error: ['Unknown table'],
    },
  ],

  tableId: [
    {
      in: 1,
      out: () => tables.CollectionObject,
    },
    {
      in: -5,
      out: undefined,
      final: undefined,
      error: ['Table with id -5 does not exist'],
    },
    {
      in: 555,
      out: undefined,
      final: undefined,
      error: ['Table with id 555 does not exist'],
    },
    {
      in: undefined,
      out: undefined,
    },
  ],

  flip: [
    {
      in: false,
      out: true,
    },
    {
      in: true,
      out: false,
    },
  ],

  toBoolean: [
    {
      in: 'true',
      out: true,
    },
    {
      in: 'false',
      out: false,
    },
    {
      in: ' yes ',
      out: true,
      final: 'true',
    },
    {
      in: 'nan',
      out: false,
      final: 'false',
    },
  ],

  toDecimal: [
    {
      in: '15',
      out: 15,
    },
    {
      in: '-1.533abc',
      out: -1,
      final: '-1',
    },
    {
      in: 'a1',
      out: undefined,
      final: undefined,
      error: ['Invalid decimal number'],
    },
  ],

  toFloat: [
    {
      in: '15',
      out: 15,
    },
    {
      in: '-1.533abc',
      out: -1.533,
      final: '-1.533',
    },
    {
      in: 'a1',
      out: undefined,
      final: undefined,
      error: ['Invalid floating point number'],
    },
  ],

  xmlChild: [
    {
      arguments: ['a'],
      in: createSimpleXmlNode(),
      out: undefined,
      final: { ...createSimpleXmlNode(), children: { a: [] } },
      error: ['Unable to find <a /> child'],
      logContext: { type: 'Child', tagName: 'a' },
    },
    {
      arguments: ['a', 'optional'],
      in: createSimpleXmlNode(),
      out: undefined,
      final: { ...createSimpleXmlNode(), children: { a: [] } },
      logContext: { type: 'Child', tagName: 'a' },
    },
    {
      arguments: ['a'],
      in: {
        ...createSimpleXmlNode(),
        children: {
          a: [createSimpleXmlNode('c')],
          A: [createSimpleXmlNode('d')],
        },
      },
      out: createSimpleXmlNode('c'),
      final: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('a')] },
      },
      logContext: { type: 'Child', tagName: 'a' },
    },
    {
      arguments: ['A'],
      in: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('g')] },
      },
      out: createSimpleXmlNode('g'),
      final: {
        ...createSimpleXmlNode(),
        children: { A: [createSimpleXmlNode('A')] },
      },
      logContext: { type: 'Child', tagName: 'A' },
    },
    {
      arguments: ['a'],
      in: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('e'), createSimpleXmlNode('l')] },
      },
      out: createSimpleXmlNode('e'),
      final: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('a')] },
      },
      logContext: { type: 'Child', tagName: 'a' },
      warn: ['Expected to find at most one <a /> child'],
    },
  ],

  xmlChildren: [
    {
      arguments: ['a'],
      in: createSimpleXmlNode(),
      out: [],
      final: { ...createSimpleXmlNode(), children: { a: [] } },
      logContext: { type: 'Children', tagName: 'a' },
    },
    {
      arguments: ['a'],
      in: {
        ...createSimpleXmlNode(),
        children: {
          a: [createSimpleXmlNode('c')],
          A: [createSimpleXmlNode('d')],
        },
      },
      out: [createSimpleXmlNode('c')],
      final: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('a')] },
      },
      logContext: { type: 'Children', tagName: 'a' },
    },
    {
      arguments: ['A'],
      in: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('g')] },
      },
      out: [createSimpleXmlNode('g')],
      final: {
        ...createSimpleXmlNode(),
        children: { A: [createSimpleXmlNode('A')] },
      },
      logContext: { type: 'Children', tagName: 'A' },
    },
    {
      arguments: ['a'],
      in: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('e'), createSimpleXmlNode('l')] },
      },
      out: [createSimpleXmlNode('e'), createSimpleXmlNode('l')],
      final: {
        ...createSimpleXmlNode(),
        children: { a: [createSimpleXmlNode('a'), createSimpleXmlNode('a')] },
      },
      logContext: { type: 'Children', tagName: 'a' },
    },
  ],

  object: [
    {
      arguments: [
        createXmlSpec({
          a: pipe(
            syncers.xmlAttribute('a', 'required'),
            syncers.fallback<string>('value')
          ),
        }),
      ],
      in: createSimpleXmlNode(),
      out: { a: 'value' },
      final: { ...createSimpleXmlNode(), attributes: { a: 'value' } },
      error: ['Required attribute "a" is missing'],
    },
  ],

  map: [
    {
      arguments: [syncers.toDecimal],
      in: ['1', '2', 'a3'],
      out: [1, 2, undefined],
      final: ['1', '2', undefined],
      error: ['Invalid decimal number'],
    },
    {
      arguments: [syncers.toDecimal],
      in: [],
      out: [],
    },
  ],

  maybe: [
    {
      arguments: [syncers.split(',')],
      in: 'a,b,c',
      out: ['a', 'b', 'c'],
    },
    {
      arguments: [syncers.split(',')],
      in: undefined,
      out: undefined,
    },
  ],

  captureLogContext: [
    {
      arguments: [],
      in: 'a,b,c',
      out: { node: 'a,b,c', logContext: {} },
    },
  ],

  dependent: [
    {
      arguments: [
        'definition',
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        (input) => ({
          a: syncers.xmlAttribute(
            input.definition.node?.tagName ?? 'c',
            'required'
          ),
        }),
      ],
      in: { definition: { node: createSimpleXmlNode('b'), logContext: {} } },
      out: { definition: { a: undefined } },
      final: { definition: { node: createSimpleXmlNode(), logContext: {} } },
      error: ['Required attribute "b" is missing'],
    },
    {
      arguments: [
        'definition',
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        (input) => ({
          a: pipe(
            syncers.xmlAttribute('a', 'skip'),
            // @ts-expect-error TS Getting confused
            syncers.fallback(input.tableName)
          ),
        }),
      ],
      in: {
        // @ts-expect-error TS Getting confused
        tableName: 'A',
        definition: { node: createSimpleXmlNode(), logContext: {} },
      },
      // @ts-expect-error TS Getting confused
      out: { tableName: 'A', definition: { a: 'A' } },
      final: {
        // @ts-expect-error TS Getting confused
        tableName: 'B',
        definition: {
          node: { ...createSimpleXmlNode(), attributes: { a: 'B' } },
          logContext: {},
        },
      },
      // @ts-expect-error TS Getting confused
      newOut: { tableName: 'B', definition: {} },
    },
  ],

  field: [
    {
      arguments: ['CollectionObject'],
      in: 'accession.accessionNumber',
      out: () => [
        getField(tables.CollectionObject, 'accession'),
        getField(tables.Accession, 'accessionNumber'),
      ],
    },
    {
      arguments: ['CollectionObject'],
      in: 'accessions',
      out: undefined,
      final: undefined,
      error: ['Unknown field: accessions'],
    },
    {
      arguments: ['CollectionObject', 'warn'],
      in: 'accessions',
      out: undefined,
      final: undefined,
      warn: ['Unknown field: accessions'],
    },
    {
      arguments: ['CollectionObject', 'silent'],
      in: 'accessions',
      out: undefined,
      final: undefined,
    },
  ],

  change: [
    {
      arguments: [
        'a',
        (object): string => (object.a as string).toUpperCase(),
        (object): string => (object.a as string).toLowerCase(),
      ],
      in: { a: 'a', b: 'b' },
      out: { a: 'A', b: 'b' },
    },
  ],

  enum: [
    {
      arguments: [['a', 'b', 'c']],
      in: 'a',
      out: 'a',
    },
    {
      arguments: [['a', 'b', 'c']],
      in: 'a1',
      out: undefined,
      final: undefined,
      error: ['Unknown value "a1". Expected one of a, b, or c'],
    },
    {
      arguments: [['a', 'b', 'c']],
      in: 'A',
      out: 'a',
      final: 'a',
    },
    {
      arguments: [['a', 'b', 'c'], true],
      in: 'A',
      out: undefined,
      final: undefined,
      error: ['Unknown value "A". Expected one of a, b, or c'],
    },
  ],

  numericEnum: [
    {
      arguments: [[-5.4, 0, 1]],
      in: -5.4,
      out: -5.4,
    },
    {
      arguments: [[-5.4, 0, 1]],
      in: -5,
      out: undefined,
      final: undefined,
      error: ['Unknown value "-5". Expected one of -5.4, 0, or 1'],
    },
  ],

  split: [
    {
      arguments: [','],
      in: 'a,b,c',
      out: ['a', 'b', 'c'],
    },
    {
      arguments: [','],
      in: 'a,, \\,c',
      out: ['a', '', ' \\', 'c'],
    },
    {
      arguments: [','],
      in: '',
      out: [],
    },
    {
      arguments: ['_'],
      in: 'a_bar_b_bar_c',
      out: ['a', 'bar', 'b', 'bar', 'c'],
    },
  ],

  fancySplit: [
    {
      arguments: [','],
      in: 'a,b,c',
      out: ['a', 'b', 'c'],
      final: 'a, b, c',
    },
    {
      arguments: [','],
      in: 'a,, \\,c',
      out: ['a', '', ',c'],
      final: 'a, , \\,c',
    },
    {
      arguments: [','],
      in: '',
      out: [],
    },
    {
      arguments: [','],
      in: 'a, b, c, d',
      out: ['a', 'b', 'c', 'd'],
    },
    {
      arguments: [','],
      in: 'a, b\nc, c\n, d',
      out: ['a', 'b\nc', 'c', 'd'],
      final: 'a, b\nc, c, d',
    },
  ],

  preserveInvalid: [
    {
      arguments: [syncers.toDecimal],
      in: 'a',
      out: { parsed: undefined, bad: 'a' },
      error: ['Invalid decimal number'],
    },
    {
      arguments: [syncers.toDecimal],
      in: '4',
      out: { parsed: 4, bad: undefined },
    },
    {
      arguments: [syncers.toDecimal],
      in: undefined,
      out: { parsed: undefined, bad: undefined },
    },
  ],

  static: [
    {
      arguments: [1],
      in: createSimpleXmlNode(),
      out: 1,
    },
  ],

  switch: [
    {
      // Simple case with missing attribute and default value
      arguments: [
        'rest',
        'definition',
        pipe(
          syncers.xmlAttribute('type', 'required'),
          syncers.fallback<string>('a')
        ),
        {
          aa: 'A',
          a: 'A',
          b: 'B',
        },
        {
          A: () =>
            createXmlSpec({
              attributeA: pipe(
                syncers.xmlAttribute('a', 'skip'),
                syncers.default<string>('a')
              ),
            }),
          B: () =>
            createXmlSpec({
              attributeB: pipe(
                syncers.xmlAttribute('b', 'skip'),
                syncers.default<string>('b')
              ),
            }),
          Unknown: () => createXmlSpec({}),
        },
        { test: 'A' },
      ],
      in: {
        rest: { node: createSimpleXmlNode(), logContext: {} },
      },
      out: {
        // @ts-expect-error TS getting confused
        rest: {
          node: createSimpleXmlNode(),
          logContext: {},
        },
        // @ts-expect-error TS getting confused
        definition: {
          type: 'A',
          rawType: 'a',
          attributeA: 'a',
        },
      },
      final: {
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'a' } },
          logContext: {},
        },
      },
      error: ['Required attribute "type" is missing'],
    },
    {
      // Unknown type
      arguments: [
        'rest',
        'definition',
        syncers.xmlAttribute('type', 'skip'),
        {
          aa: 'A',
          a: 'A',
          b: 'B',
        },
        {
          A: () =>
            createXmlSpec({
              attributeA: pipe(
                syncers.xmlAttribute('a', 'skip'),
                syncers.default<string>('a')
              ),
            }),
          B: () =>
            createXmlSpec({
              attributeB: pipe(
                syncers.xmlAttribute('b', 'skip'),
                syncers.default<string>('b')
              ),
            }),
          Unknown: () => createXmlSpec({}),
        },
        { test: 'A' },
      ],
      in: {
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'c' } },
          logContext: {},
        },
      },
      out: {
        // @ts-expect-error TS getting confused
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'c' } },
          logContext: {},
        },
        // @ts-expect-error TS getting confused
        definition: {
          type: 'Unknown',
          rawType: 'c',
        },
      },
      error: ['Unknown value "c". Expected one of aa, a, or b'],
    },
    {
      // Modifying the type
      arguments: [
        'rest',
        'definition',
        syncers.xmlAttribute('type', 'skip'),
        {
          aa: 'A',
          a: 'A',
          bb: 'B',
          b: 'B',
        },
        {
          A: () =>
            createXmlSpec({
              attributeA: pipe(
                syncers.xmlAttribute('a', 'skip'),
                syncers.default<string>('a')
              ),
            }),
          B: () =>
            createXmlSpec({
              attributeB: pipe(
                syncers.xmlAttribute('b', 'skip'),
                syncers.default<string>('b')
              ),
            }),
          Unknown: () => createXmlSpec({}),
        },
        { test: 'A' },
      ],
      in: {
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'a' } },
          logContext: {},
        },
      },
      out: {
        // @ts-expect-error TS getting confused
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'a' } },
          logContext: {},
        },
        // @ts-expect-error TS getting confused
        definition: {
          type: 'A',
          rawType: 'a',
          attributeA: 'a',
        },
      },
      newOut: {
        // @ts-expect-error TS getting confused
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'a' } },
          logContext: {},
        },
        // @ts-expect-error TS getting confused
        definition: {
          type: 'B',
          rawType: 'a',
          attributeB: 'b2',
        },
      },
      final: {
        rest: {
          node: {
            ...createSimpleXmlNode(),
            attributes: { type: 'bb', b: 'b2' },
          },
          logContext: {},
        },
      },
    },
    {
      // Modifying the raw type
      arguments: [
        'rest',
        'definition',
        syncers.xmlAttribute('type', 'skip'),
        {
          aa: 'A',
          a: 'A',
          bb: 'B',
          b: 'B',
        },
        {
          A: () =>
            createXmlSpec({
              attributeA: pipe(
                syncers.xmlAttribute('a', 'skip'),
                syncers.default<string>('a')
              ),
            }),
          B: () =>
            createXmlSpec({
              attributeB: pipe(
                syncers.xmlAttribute('b', 'skip'),
                syncers.default<string>('b')
              ),
            }),
          Unknown: () => createXmlSpec({}),
        },
        { test: 'A' },
      ],
      in: {
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'aa' } },
          logContext: {},
        },
      },
      out: {
        // @ts-expect-error TS getting confused
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'aa' } },
          logContext: {},
        },
        // @ts-expect-error TS getting confused
        definition: {
          type: 'A',
          rawType: 'aa',
          attributeA: 'a',
        },
      },
      newOut: {
        // @ts-expect-error TS getting confused
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'aa' } },
          logContext: {},
        },
        // @ts-expect-error TS getting confused
        definition: {
          type: 'A',
          rawType: 'a',
          attributeA: 'a',
        },
      },
      final: {
        rest: {
          node: { ...createSimpleXmlNode(), attributes: { type: 'a' } },
          logContext: {},
        },
      },
    },
  ],
};

Object.entries(tests).forEach(([syncerName, tests]) =>
  describe(syncerName, () =>
    tests.forEach(
      (
        {
          in: input,
          out: rawOutput,
          logContext,
          warn: expectedWarnings = [],
          error: expectedErrors = [],
          ...rest
        },
        index
      ) =>
        describe(`#${index + 1}`, () => {
          const syncer = syncers[syncerName] as
            | Syncer<unknown, unknown>
            | ((...args: RA<unknown>) => Syncer<unknown, unknown>);
          const final = 'final' in rest ? rest.final : input;
          const rawSecondOutput = 'newOut' in rest ? rest.newOut : rawOutput;

          test('serializer', () => {
            setLogContext({});

            const warnings: WritableArray<unknown> = [];
            const errors: WritableArray<unknown> = [];
            const consoleWarn = jest.fn((...args) => warnings.push(args[0]));
            const consoleError = jest.fn((...args) => errors.push(args[0]));
            jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
            jest.spyOn(console, 'error').mockImplementation(consoleError);

            if (
              input !== final &&
              JSON.stringify(input) === JSON.stringify(final)
            )
              throw new Error(
                "Since input and final are the same, you don't need to specify final"
              );

            const result =
              typeof syncer === 'function'
                ? syncer(
                    ...('arguments' in rest
                      ? typeof rest.arguments === 'function'
                        ? rest.arguments()
                        : rest.arguments
                      : error('Expected to receive "arguments"'))
                  ).serializer(input)
                : syncer.serializer(input);
            const output =
              typeof rawOutput === 'function' ? rawOutput() : rawOutput;

            expect(
              result instanceof SpecifyTable || result instanceof FieldBase
                ? result.toJSON()
                : result
            ).toEqual(
              output instanceof SpecifyTable || output instanceof FieldBase
                ? output.toJSON()
                : output
            );

            expect(getLogContext()).toEqual(
              logContext === undefined ? {} : { [pathKey]: [logContext] }
            );

            expect(warnings).toEqual(expectedWarnings);
            expect(errors).toEqual(expectedErrors);
          });
          test('deserializer', () => {
            const secondOutput =
              typeof rawSecondOutput === 'function'
                ? rawSecondOutput()
                : rawSecondOutput;
            const output =
              typeof rawOutput === 'function' ? rawOutput() : rawOutput;

            if (
              'newOut' in rest &&
              output !== secondOutput &&
              JSON.stringify(output) === JSON.stringify(secondOutput)
            )
              throw new Error(
                "Since output and secondOutput are the same, you don't need to specify secondOutput"
              );

            const result =
              typeof syncer === 'function'
                ? syncer(
                    ...('arguments' in rest
                      ? typeof rest.arguments === 'function'
                        ? rest.arguments()
                        : rest.arguments
                      : error('Expected to receive "arguments"'))
                  ).deserializer(secondOutput)
                : syncer.deserializer(secondOutput);
            expect(
              result instanceof SpecifyTable || result instanceof FieldBase
                ? result.toJSON()
                : result
            ).toEqual(
              final instanceof SpecifyTable || final instanceof FieldBase
                ? final.toJSON()
                : final
            );
          });
        })
    )
  )
);
