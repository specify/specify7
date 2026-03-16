import { requireContext } from '../../../tests/helpers';
import { fetchContext, getCollectionPref, getPref } from '../remotePrefs';

requireContext();

test('fetches and parses remotePrefs correctly', async () =>
  expect(fetchContext).resolves.toMatchSnapshot());

describe('Parsing Remote Prefs', () => {
  test('parses boolean value', () =>
    expect(getPref('auditing.do_audits')).toBe(false));
  test('parses numeric value', () =>
    expect(getPref('attachment.preview_size')).toBe(123));
});

test('can retrieve collection pref', () =>
  expect(getCollectionPref('CO_CREATE_COA', 32_678)).toBe(false));
