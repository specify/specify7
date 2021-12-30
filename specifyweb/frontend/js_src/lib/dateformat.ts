import remoteprefs from './remoteprefs';

const DEFAULT_FORMAT = 'YYYY-MM-DD';
const fullDateFormat = (): string =>
  remoteprefs['ui.formatting.scrdateformat']?.toUpperCase() ?? DEFAULT_FORMAT;
export default fullDateFormat;

const DEFAULT_MONTH_FORMAT = 'MM/YYYY';
export const monthFormat = (): string =>
  remoteprefs['ui.formatting.scrmonthformat']?.toUpperCase() ??
  DEFAULT_MONTH_FORMAT;

export const accessibleDatePickerEnabled = (): boolean =>
  typeof remoteprefs['ui.formatting.accessible_date_input'] !== 'string' ||
  remoteprefs['ui.formatting.accessible_date_input'].toLowerCase() !== 'false';

export const accessibleMonthPickerEnabled = (): boolean =>
  typeof remoteprefs['ui.formatting.accessible_month_input'] !== 'string' ||
  remoteprefs['ui.formatting.accessible_month_input'].toLowerCase() !== 'false';
