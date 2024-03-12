import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { exportsForTests } from '../Compare';

const { findDiffering } = exportsForTests;

requireContext();

describe('findDiffering', () => {
  const getResources = () => [
    new tables.Agent.Resource()
      .set('lastName', '1')
      .set('firstName', '1')
      .set('middleInitial', '1')
      .set('date1', '2020-10-10')
      // Don't include dependent field if source is visible
      .set('date1Precision', 2)
      .set('date2', '2020-01-01')
      // Include dependent if source is not visible
      .set('date2Precision', 1),
    new tables.Agent.Resource()
      .set('lastName', '2')
      .set('firstName', '1')
      .set('date2', '2020-01-01'),
  ];

  test('without matching fields', () =>
    expect(
      findDiffering(false, tables.Agent, getResources()).map(({ name }) => name)
    ).toMatchInlineSnapshot(`
      [
        "date1",
        "date2Precision",
        "lastName",
        "middleInitial",
      ]
    `));

  test('with matching fields', () =>
    expect(
      findDiffering(true, tables.Agent, getResources()).map(({ name }) => name)
    ).toMatchInlineSnapshot(`
      [
        "date1",
        "date2",
        "date1Precision",
        "date2Precision",
        "firstName",
        "lastName",
        "middleInitial",
        "division",
      ]
    `));
});
