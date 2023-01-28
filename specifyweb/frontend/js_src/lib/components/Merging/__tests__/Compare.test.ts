import { exportsForTests } from '../Compare';
import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';

const { findDiffering } = exportsForTests;

requireContext();

describe('findDiffering', () => {
  const getResources = () => [
    new schema.models.Agent.Resource()
      .set('lastName', '1')
      .set('firstName', '1')
      .set('middleInitial', '1')
      .set('date1', '2020-10-10')
      // Don't include dependent field if source is visible
      .set('date1Precision', 2)
      .set('date2', '2020-01-01')
      // Include dependent if source is not visible
      .set('date2precision', 1),
    new schema.models.Agent.Resource()
      .set('lastName', '2')
      .set('firstName', '1')
      .set('date2', '2020-01-01'),
  ];

  test('without matching fields', () =>
    expect(
      findDiffering(false, schema.models.Agent, getResources()).map(
        ({ name }) => name
      )
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
      findDiffering(true, schema.models.Agent, getResources()).map(
        ({ name }) => name
      )
    ).toMatchInlineSnapshot(`
      [
        "date1",
        "date2",
        "date1Precision",
        "date2Precision",
        "firstName",
        "lastName",
        "middleInitial",
      ]
    `));
});
