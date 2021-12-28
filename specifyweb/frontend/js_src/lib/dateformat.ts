import remoteprefs from './remoteprefs';

const DEFAULT_FORMAT = 'YYYY-MM-DD';

export default (): string =>
  remoteprefs['ui.formatting.scrdateformat']?.toUpperCase() ?? DEFAULT_FORMAT;
