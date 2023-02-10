import { requireContext } from '../../../tests/helpers';
import {
  fetchContext,
  getCollectionPref,
  getRemotePref,
  remotePrefsDefinitions,
} from '../remotePrefs';

requireContext();

test('fetches and parses remotePrefs correctly', async () =>
  expect(fetchContext).resolves.toMatchSnapshot());

describe('Parsing Remote Prefs', () => {
  test('parses boolean value', () =>
    expect(getRemotePref('auditing.do_audits')).toBe(false));
  test('parses numeric value', () =>
    expect(getRemotePref('attachment.preview_size')).toBe(123));
  test('uses default value if pref is not set', () =>
    expect(getRemotePref('form.definition.columnSource')).toBe(
      remotePrefsDefinitions()['form.definition.columnSource'].defaultValue
    ));
});

test('can retrieve collection pref', () =>
  expect(getCollectionPref('CO_CREATE_COA', 32_678)).toBe(false));
