# Front-end files

Front-end JavaScript and TypeScript files

## Folder Structure

Folder structure has been adapted from that of
[Josh Comeau](https://www.joshwcomeau.com/react/file-structure/), which in turn
is similar to how most modern React projects are structured.

### Utils

In summary, there is an `utils` folder that contains all the utility functions
that don't belong to any single component, but are used by many of them. For
exampls, `ajax` (a wrapper for `fetch`), `cache` (a wrapper for `localStorage`),
and `uiParse` (data validation).

The files in the `utils` folder must not be React components or React hooks (for
the sake of consistency). React hooks that are used by several components should
be placed in the `./hooks` directory. Hooks used by only a single component
should be placed somewhere within the component directory (either separate file
or inline with the component)

### Tests

`./tests` directory includes the mocks and helpers for tests. The tests themself
are to be located in the `__tests__` directory inside of each component. This
ensures tests are closer to the component they are testing when looking at the
file tree.

### Components

Create a directory for each feature in the `./components` folder.

What constitutes a single feature depends on your jugement, and the number of
files included in the feature. For example, `Query Builder` and is a single
feature, where as the Form system has been split into half a dozen directories
(for parsing, rendering a form, and dealing with record sets) due to a large
number of files.

Utils and hook files that are applicable to a single feature only should be
placed in the directory along with the other files.

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

## Comment style

Most of these things are enforced through ESLint rules, but mentioning them here
just in case you don't have ESLint enabled (please don't do that):

- Comments must always begin with upper case letter

  Reasoning: it's always consistent, and for multi-line comments this make it
  easy to see whether the comment is a single sentence or multiple sentences.

- Lines should not be longer than 80 characters

  Reasoning: this is the same requirement we have for all code files. Comments
  should be consistent with that (to avoid the need for horizontal scrolling).

- Single line comments can use `//`

  Example:

  ```js
  // Console log 5 times
  Array.from({ length: 5 }).map(console.log);
  ```

- Any multi line comments must use `/*`:

  ```js
  /*
   * First line.
   * Second line
   */
  ```

- For comments that describe a function, a class, a global/exported variable or
  a comment at the top of the file, instead of `/*` use `/**`. Like this:

  ```js
  /**
   * First line.
   * Second line
   */
  ```

  See more examples across our codebase. `/**` is a special syntax (powered by
  TSDoc). It adds fancy features and even allows rendering markdown. For syntax
  see https://tsdoc.org/

  For example, here is my IDE rendering such a comments:

  ![](https://user-images.githubusercontent.com/40512816/234322371-99b339c0-224b-433f-9ae8-ee5862852817.png)

  ![](https://user-images.githubusercontent.com/40512816/234322822-afbcd42d-5b4b-444d-8d98-f9af57cbfd1f.png)
