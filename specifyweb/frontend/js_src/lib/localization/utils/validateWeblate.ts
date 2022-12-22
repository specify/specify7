import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { Http } from '../../utils/ajax/definitions';
import { testLogging } from './testLogging';
import { DictionaryUsages } from './scanUsages';

/**
 * Which branch the strings are coming from.
 * If modifying this, also update the trigger in the GitHub Action
 */
const syncBranch = 'production';

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

export async function checkComponents(
  localStrings: DictionaryUsages
): Promise<void> {
  const localComponents = Object.values(localStrings).map(
    ({ categoryName }) => categoryName
  );

  const ignoredComponents = new Set(['glossary']);
  const weblateComponents = await fetch(componentsApiUrl, {
    headers: { Authorization: getToken() },
  })
    .then(async (response) => response.json())
    .then(({ results }) =>
      (results as RA<IR<unknown>>).filter(
        ({ slug }) => !f.has(ignoredComponents, slug)
      )
    );

  checkSettings(weblateComponents);

  const componentNames = weblateComponents.map(({ slug }) => slug as string);

  const unusedComponents = componentNames.filter(
    (name) => !localComponents.includes(name)
  );
  unusedComponents.forEach((name) =>
    error(
      `Found a project ${name} in the remote, but it's not present on the current branch`
    )
  );

  const missingComponents = localComponents.filter(
    (name) => !componentNames.includes(name)
  );
  await createMissingComponents(missingComponents);
}

const createMissingComponents = async (names: RA<string>): Promise<void> =>
  Promise.all(names.map(async (name) => createComponent(name))).then(f.void);

async function createComponent(name: string): Promise<void> {
  warn(`Creating a component for "${name}"`);
  return fetch(componentsApiUrl, {
    headers: {
      Authorization: getToken(),
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(getComponentSettings(name)),
  })
    .then(async (response) =>
      response.status === Http.NO_CONTENT
        ? f.void()
        : Promise.reject(await response.text())
    )
    .then(console.log);
}

const getComponentSettings = (name: string): IR<unknown> => ({
  allow_translation_propagation: true,
  auto_lock_error: true,
  branch: 'weblate-localization',
  commit_pending_age: 3,
  edit_template: true,
  file_format: 'po-mono',
  filemask: `strings/${name}/*${gettextExtension}`,
  language_code_style: '',
  language_regex: '^[^.]+$',
  license: 'GPL-2.0-only',
  license_url: 'https://spdx.org/licenses/GPL-2.0-only.html',
  merge_style: 'rebase',
  name,
  push_branch: 'weblate-localization',
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
    source_language: (rawRemote.source_language as { readonly code: string })[
      'code'
    ],
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
