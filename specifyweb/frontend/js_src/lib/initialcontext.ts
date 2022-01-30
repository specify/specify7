import ajax, { type MimeType } from './ajax';
import type { RA } from './types';

export async function load<T>(path: string, mimeType: MimeType): Promise<T> {
  // eslint-disable-next-line no-console
  console.log('initial context:', path);
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return ajax<T>(path, { headers: { Accept: mimeType } }).then(
    ({ data }) => data
  );
}

export default Promise.all([
  import('./attachments'),
  import('./icons'),
  import('./querycbx'),
  import('./querycbxsearch'),
  import('./remoteprefs'),
  import('./schema'),
  import('./schemabase'),
  import('./stringlocalization'),
  import('./systeminfo'),
  import('./uiformatters'),
  import('./weblinkbutton'),
  import('./userinfo'),
  import('./treedefinitions'),
]).then(async (modules) =>
  Promise.all(
    (modules as RA<{ readonly fetchContext: Promise<void> }>).map(
      async ({ fetchContext }) => fetchContext
    )
  )
);
