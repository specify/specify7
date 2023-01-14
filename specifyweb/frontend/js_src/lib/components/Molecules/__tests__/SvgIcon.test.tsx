import { sortFunction } from '../../../utils/utils';
import { exportsForTests } from '../SvgIcon';

const { colorMapper } = exportsForTests;

test('colorMapper entries are sorted', () =>
  expect(colorMapper).toEqual(
    Object.fromEntries(
      Object.entries(colorMapper).sort(sortFunction(([key]) => key))
    )
  ));
