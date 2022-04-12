/**
 * Read the preferred date format from remote prefs
 */

import { getPref } from './remoteprefs';

export const databaseDateFormat = 'YYYY-MM-DD';
export const fullDateFormat = (): string =>
  getPref('ui.formatting.scrdateformat');

export const monthFormat = (): string =>
  getPref('ui.formatting.scrmonthformat');

export const accessibleDatePickerEnabled = (): boolean =>
  getPref('ui.formatting.accessible_date_input');

export const accessibleMonthPickerEnabled = (): boolean =>
  getPref('ui.formatting.accessible_month_input');
