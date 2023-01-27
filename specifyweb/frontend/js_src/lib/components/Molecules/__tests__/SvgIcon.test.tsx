import { exportsForTests } from '../SvgIcon';
import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';

const { colorMapper } = exportsForTests;

requireContext();

test('colorMapper defines colors for all tables', () =>
  expect(new Set(Object.keys(colorMapper()))).toEqual(
    new Set(Object.keys(schema.models))
  ));
