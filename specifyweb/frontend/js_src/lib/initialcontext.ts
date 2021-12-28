import ajax, { type MimeType } from './ajax';
import type { RA } from './types';

export async function load<T>(path: string, mimeType: MimeType): Promise<T> {
  // eslint-disable-next-line no-console
  console.log('initial context:', path);
  return ajax<T>(path, { headers: { Accept: mimeType } }).then(
    ({ data }) => data
  );
}

export default Promise.all([
  import('./attachments'),
  import('./dataobjformatters'),
  import('./icons'),
  import('./querycbx'),
  import('./querycbxsearch'),
  import('./remoteprefs'),
  import('./schema'),
  import('./schemabase'),
  import('./specifymodel'),
  import('./stringlocalization'),
  import('./systeminfo'),
  import('./uiformatters'),
  import('./weblinkbutton'),
  import('./userinfo'),
]).then(async (modules) =>
  Promise.all(
    (modules as RA<{ readonly fetchContext: Promise<void> }>).map(
      async ({ fetchContext }) => fetchContext
    )
  )
);
