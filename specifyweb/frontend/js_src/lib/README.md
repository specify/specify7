# Front-end files

Front-end JavaScript and TypeScript files

## DevTools for development

### React DevTools

React DevTools Chrome and Firefox extension is an integral part of
troubleshooting or developing a React application. They allow to preview and
modify the state of any component.

### Development mode

When app is built in development, certain additional tools become available:

- `_schema` global object is created. It exposes the export from
  [`./schema`](../schema.ts) for easier debugging.
- `_permissions` global object is created. It contains user permissions from
  [`./permissions`](../permissions.ts) for easier debugging.
- `_csrf` global string is added, containing the CSRF authentication token,
  which is needed for many API calls. See [`../csrftoken.ts`](../csrftoken.ts)
- `_goTo` function is created. It allows to simulate a navigation by making
  router navigate to a given address.
- Error Dialogs can be dismissed when in Development.
- Autocomplete lists and CustomSelectElement lists do not close on outside
  click. This is to help with debugging them though browser's DevTools.
- UI localization languages that are not yet fully translated become available.
  This is controlled by [`../localization/utils.tsx](../localization/utils.tsx)
- Back-end permissions registry is checked to make sure front-end's list of
  permissions is kept in sync.
- Tailwind generates all possible class names, unlike in production, where it
  prunes unused class names.

## TODOs

Instead of `// TODO: ` comments, the front-end uses the following comments:

- `// REFACTOR:` - for code refactoring tasks.
- `// FEATURE:` - a task that add a new feature. Use this only if a feature is
  small. For larger features create a GitHub issue.
- `// BUG:` - a small bug, or a possible bug. For larger bugs, create a GitHub
  issue.
- `// TEST:` - a task that requires manually verifying some behavior, or adding
  an automated test.
- `// FIXME:` - a task that must be completed in this commit. This commonly
  includes temporary code modifications that must be reversed before pushing the
  code.

  `ESLint` config has a rule that highlights all `FIXME` comments as errors,
  thus helping you to remember to fix them before committing.

  More importantly the `regex-blacklist` hook for `pre-commit.com` prevents a
  commit if it contains `FIXME` comments.

The benefit of using several types of comments rather than just `TODO`:

- You can configure your IDE to assign different colors to different TODO types
- You can configure automated tools to work on specific types of TODOs (like
  `ESLint` and `pre-commit.com` for `FIXME` comments).
- If you IDE has a tool that displays a list of all TODOs, you can set a filter
  there to see only a single type of TODOs at a time.
- When `grep`ing tcode, there are fewer `TODOs` to grep for, if you know the
  category your `TODO` belosngs to.
- Can visually scan a `TODO` and immediately know what it involves doing
  (testing / bug fixing / refactoring / adding a feature)
