import { requireContext } from '../../../tests/helpers';
import {
  fetchContext,
  getCollectionPref,
  getPref,
  remotePrefsDefinitions,
} from '../remotePrefs';

requireContext();

test('fetches and parses remotePrefs correctly', async () =>
  expect(fetchContext).resolves.toMatchSnapshot());

describe('Parsing Remote Prefs', () => {
  test('parses boolean value', () =>
    expect(getPref('auditing.do_audits')).toBe(false));
  test('parses numeric value', () =>
    expect(getPref('attachment.preview_size')).toBe(123));
  test('uses default value if pref is not set', () =>
    expect(getPref('ui.formatting.scrmonthformat')).toBe(
      remotePrefsDefinitions()['ui.formatting.scrmonthformat'].defaultValue
    ));
});

test('can retrieve collection pref', () =>
  expect(getCollectionPref('CO_CREATE_COA', 32_678)).toBe(false));

test('parses collection boolean pref', () =>
  expect(
    getCollectionPref('attachment.is_public_default', 32_768)
  ).toBe(true));

test('parses collection tree synonym pref', () =>
  expect(
    getCollectionPref(
      'sp7.allow_adding_child_to_synonymized_parent.Taxon',
      32_768
    )
  ).toBe(true));

test('parses collection chronostrat synonym pref', () =>
  expect(
    getCollectionPref(
      'sp7.allow_adding_child_to_synonymized_parent.GeologicTimePeriod',
      32_768
    )
  ).toBe(true));
