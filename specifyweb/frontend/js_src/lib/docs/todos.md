# TODOs

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
