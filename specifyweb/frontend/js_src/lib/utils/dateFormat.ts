/**
 * Read the preferred date format from remote prefs
 */

import { getRemotePref } from '../components/InitialContext/remotePrefs';

export const databaseDateFormat = 'YYYY-MM-DD';
export const fullDateFormat = (): string =>
  getRemotePref('ui.formatting.scrdateformat');

export const monthFormat = (): string =>
  getRemotePref('ui.formatting.scrmonthformat');
