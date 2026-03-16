/**
 * Read the preferred date format from remote prefs
 */
import { getPref } from '../../components/InitialContext/remotePrefs';

export const fullDateFormat = (): string =>
  getPref('ui.formatting.scrdateformat');

export const monthFormat = (): string =>
  getPref('ui.formatting.scrmonthformat');

export function formatDateForBackEnd(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  const hours = date.getHours().toString();
  const minutes = date.getMinutes().toString();
  const seconds = date.getSeconds().toString();

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
