import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { glob } from '../../../node_modules/typedoc/dist/lib/utils/fs';
import {
  createMinimatch,
  matchesAny,
} from '../../../node_modules/typedoc/dist/lib/utils/paths';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'specify-typedoc-'));

beforeAll(() => {
  fs.mkdirSync(path.join(root, 'nested'));
  fs.mkdirSync(path.join(root, 'node_modules'));
  [
    'entry.ts',
    'nested/deep.ts',
    'nested/ignore.js',
    'node_modules/ignored.ts',
  ].forEach((file) => fs.writeFileSync(path.join(root, file), ''));
});

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

test('TypeDoc traverses nested directories with patched minimatch', () =>
  expect(glob(`${root}/**/*.ts`, root).sort()).toEqual(
    [path.join(root, 'entry.ts'), path.join(root, 'nested/deep.ts')].sort()
  ));

test('TypeDoc supports brace patterns during directory traversal', () =>
  expect(glob(`${root}/{entry,nested/deep}.ts`, root).sort()).toEqual(
    [path.join(root, 'entry.ts'), path.join(root, 'nested/deep.ts')].sort()
  ));

test('TypeDoc exclusion patterns still match JavaScript files', () => {
  const patterns = createMinimatch(['**/*.js']);
  expect(matchesAny(patterns, path.join(root, 'nested/ignore.js'))).toBe(true);
  expect(matchesAny(patterns, path.join(root, 'nested/deep.ts'))).toBe(false);
});
