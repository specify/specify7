import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { syncBranch, weblateBranch } from './config';
import type { DictionaryUsages } from './scanUsages';
import { testLogging } from './testLogging';

const { error, warn } = testLogging;

export const gettextExtension = '.po';
const projectName = 'specify-7';
const componentsApiUrl = `https://hosted.weblate.org/api/projects/${projectName}/components/`;

function getToken(): string {
  const key = process.env.WEBLATE_API_TOKEN;
  if (typeof key !== 'string')
    throw new Error(`WEBLATE_API_TOKEN environment variable is not set`);
  return `Token ${key}`;
}

const doFetch = async (url: string): Promise<IR<unknown>> =>
  fetch(url, {
    headers: { Authorization: getToken() },
  }).then(async (response) => response.json());

const ignoredComponents = new Set(['glossary']);
const fetchComponents = async (
  url = componentsApiUrl
): Promise<RA<IR<unknown>>> =>
  doFetch(url).then(async ({ results, next }) => [
    ...(typeof next === 'string' ? await fetchComponents(next) : []),
    ...(await Promise.all(
      (results as RA<IR<unknown>>)
        .filter(({ slug }) => !f.has(ignoredComponents, slug))
        .map(async (component) => ({
          ...component,
          addons: await Promise.all(
            (component.addons as RA<string>).map(doFetch)
          ),
        }))
    )),
  ]);

export async function checkComponents(
  localStrings: DictionaryUsages
): Promise<void> {
  const localComponents = Object.values(localStrings).map(
    ({ categoryName }) => categoryName
  );
  const weblateComponents = await fetchComponents();

  checkSettings(weblateComponents);

  const componentNames = weblateComponents.map(({ slug }) => slug as string);

  const unusedComponents = componentNames.filter(
    (name) => !localComponents.includes(name)
  );
  unusedComponents.forEach((name) =>
    /*
     * Maybe there is a better way to handle this, but for now this forces
     * developer's intervention to manually resolve the issue.
     * I.e, delete the old component from Weblate, or fix the naming
     * inconsistency
     */
    error(
      `Found a project "${name}" in Weblate, but it's not present on ` +
        `the current branch. If you intentionally removed it, make sure to also ` +
        `remove it from Weblate.`
    )
  );

  const missingComponents = localComponents.filter(
    (name) => !componentNames.includes(name)
  );
  await createMissingComponents(missingComponents);
}

const createMissingComponents = async (names: RA<string>): Promise<void> =>
  Promise.all(names.map(async (name) => createComponent(name))).then(f.void);

/**
 * Note, if this fails with "File not found error", it means the *.po file for
 * a given component is not on the weblate-localization branch. The test.yml
 * GitHub action on production branch is responsible for creating the *.po
 * file.
 */
async function createComponent(name: string): Promise<void> {
  warn(`Creating a component for "${name}"`);
  const { addons, ...settings } = getComponentSettings(name);
  fetch(componentsApiUrl, {
    headers: {
      Authorization: getToken(),
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(settings),
  })
    .then(async (response) =>
      response.status === Http.CREATED
        ? f.void()
        : Promise.reject(await response.text())
    )
    .then(console.log);
}

const addOns = {
  'weblate.autotranslate.autotranslate': {
    mode: 'fuzzy',
    filter_type: 'todo',
    auto_source: 'mt',
    component: null,
    engines: ['google-translate'],
    threshold: 20,
  },
  'weblate.cleanup.generic': {},
};

const getComponentSettings = (name: string): IR<unknown> => ({
  addons: addOns,
  allow_translation_propagation: true,
  auto_lock_error: true,
  branch: weblateBranch,
  commit_pending_age: 3,
  check_flags: 'icu-message-format, icu-flags:xml, icu-flags:strict-xml',
  edit_template: true,
  file_format: 'po-mono',
  filemask: `strings/${name}/*${gettextExtension}`,
  language_code_style: '',
  language_regex: '^[^.]+$',
  license: 'GPL-2.0-only',
  license_url: 'https://spdx.org/licenses/GPL-2.0-only.html',
  merge_style: 'rebase',
  name,
  new_lang: 'url',
  push_branch: weblateBranch,
  push_on_commit: true,
  repo: 'https://github.com/specify/specify7/',
  push: 'git@github.com:specify/specify7.git',
  repoweb: `https://github.com/specify/specify7/tree/${syncBranch}/specifyweb/frontend/js_src/lib/{{filename}}#L{{line}}`,
  report_source_bugs: 'support@specifysoftware.org',
  source_language: 'en_US',
  slug: name,
  template: `strings/${name}/en_US${gettextExtension}`,
  vcs: 'git',
});

/**
 * Makes sure settings for all Weblate components are kept in sync.
 *
 * There doesn't seem to be a way to duplicate a component in Weblate, so
 * have to add this check to make sure settings match.
 */
const checkSettings = (components: RA<IR<unknown>>): void =>
  components.forEach((component) =>
    compareConfig(
      component.name as string,
      component,
      getComponentSettings(component.name as string)
    )
  );

function compareConfig(
  name: string,
  rawRemote: IR<unknown>,
  local: IR<unknown>
): void {
  const remote: IR<unknown> = {
    ...rawRemote,
    addons: Object.fromEntries(
      (
        rawRemote.addons as RA<{
          readonly name: string;
          readonly configuration: IR<unknown>;
        }>
      )
        .filter(({ name }) => name in addOns)
        .sort(
          sortFunction(({ name }) =>
            Object.keys(addOns).indexOf(name as keyof typeof addOns)
          )
        )
        .map(({ name, configuration }) => [name, configuration])
    ),
    source_language: (rawRemote.source_language as { readonly code: string })
      .code,
  };
  Object.entries(local).forEach(([key, value]) =>
    JSON.stringify(value) === JSON.stringify(remote[key])
      ? undefined
      : error(
          `Weblate config for "${name}" component for "${key}" setting ` +
            `does not match what is expected.\n` +
            `Expected: ${JSON.stringify(value)}\n` +
            `Received: ${JSON.stringify(remote[key])}`
        )
  );
}
