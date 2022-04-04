import { getBoolPref, getPref } from './remoteprefs';

export const databaseDateFormat = 'YYYY-MM-DD';
export const fullDateFormat = (): string =>
  getPref('ui.formatting.scrdateformat', databaseDateFormat).toUpperCase();

const DEFAULT_MONTH_FORMAT = 'MM/YYYY';
export const monthFormat = (): string =>
  getPref('ui.formatting.scrmonthformat', DEFAULT_MONTH_FORMAT).toUpperCase();

export const accessibleDatePickerEnabled = (): boolean =>
  getBoolPref('ui.formatting.accessible_date_input', true);

export const accessibleMonthPickerEnabled = (): boolean =>
  getBoolPref('ui.formatting.accessible_month_input', true);
