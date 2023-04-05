/**
 * Read the preferred date format from remote prefs
 */
import { getPref } from '../../components/InitialContext/remotePrefs';

export const fullDateFormat = (): string =>
  getPref('ui.formatting.scrdateformat');

export const monthFormat = (): string =>
  getPref('ui.formatting.scrmonthformat');
