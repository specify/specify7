# AGENTS.md

This file gives coding agents and contributors project context and repeatable
workflows for Specify 7. It complements the README and repository configuration.
When instructions here differ from current configuration or CI, follow the latter.
In nested directories, follow the nearest `AGENTS.md`; a direct user instruction takes
precedence over this file.

## Project overview

- `specifyweb/frontend/js_src/` contains the React and TypeScript frontend. Tailwind
  supplies most styling. Jest, Testing Library, and jsdom provide unit and component
  tests.
- `specifyweb/backend/` contains Django applications for accounts, permissions,
  workbench uploads, record merging, stored queries, trees, attachments, and other
  services. Backend tests live beside their applications, commonly under `tests/`.
- `specifyweb/specify/` contains core models, API behavior, schema, management
  commands, and shared backend code. Persistence generally uses Django's ORM;
  specialized query paths also use SQLAlchemy.
- `specifyweb/settings/` contains Django settings. Local generated or secret settings
  are environment-specific and must not be committed.
- `config/` contains discipline and common Specify configuration.
- `docker-compose.yml` defines the development stack, including MariaDB, Django,
  webpack, Celery, Redis, Nginx, the asset server, and the report runner.
- `Makefile`, `requirements*.txt`, `pytest.ini`, the frontend `package.json`, and
  `.github/workflows/` define supported tools and CI checks.

## Development environment

- Read the relevant implementation, nearby tests, and current configuration before
  making changes. Search for an existing pattern first.
- The frontend's supported Node version is declared in
  `specifyweb/frontend/js_src/package.json` (currently Node 24). Run frontend commands
  from that directory. Use `npm ci` for a clean dependency install; do not change
  `package-lock.json` unless dependencies intentionally change.
- The canonical backend test runner is Django's test runner, not pytest. CI currently
  uses Python 3.12, MariaDB, Redis, `requirements.txt`, and
  `requirements-testing.txt`.
- When the development stack is running, use the Compose service name `specify7` rather
  than a generated container name. Container logs are available with
  `docker logs specify7 --tail 100`.

## Code style and implementation

- Keep changes focused on the stated issue. Avoid unrelated refactors, formatting,
  dependency upgrades, or speculative features.
- Preserve existing user changes. Check `git status` before editing; do not discard,
  overwrite, or include unrelated work.
- Follow nearby code conventions and use the repository's configured formatters,
  linters, and type checkers for changed files.
- Test observable behavior and public contracts rather than incidental implementation
  details. Keep tests deterministic, isolated, and fast. Mock external HTTP, file, clock,
  and worker boundaries when appropriate; use real project models or helpers when the
  integration itself is under test.
- For behavior changes and bug fixes, add or update automated tests. Prefer regression
  tests that fail before the fix. Cover relevant boundaries, validation, permissions,
  and negative cases.

## Shared frontend components

Component paths in this section are relative to
`specifyweb/frontend/js_src/lib/components/`; `css/main.css` and
`tailwind.config.ts` are relative to `specifyweb/frontend/js_src/`.
Start with the shared implementation
and representative consumers before introducing a new UI pattern. `Atoms/` contains
styled native elements; `Molecules/` contains reusable components with interaction
logic. Feature directories compose these with Specify's resource and permission
systems.

Buttons, dialogs, inputs, labels, and links are the most broadly reused component
families. Changes to these primitives can affect many unrelated workflows. Direct
JSX counts understate the importance of record forms: a few renderer call sites
generate fields and subforms from configuration at runtime.

### Buttons, submission, and navigation

- Use `Atoms/Button.tsx` for actions, `Atoms/Submit.tsx` for form submission, and
  `Atoms/Link.tsx` for navigation. Preserve native semantics even when the controls
  look alike. Ordinary `Button` variants set `type="button"` to avoid accidental
  submission and disable themselves when `onClick` is undefined.
- Existing button variants mix size (`Small`), appearance (`Fancy`,
  `BorderedGray`), intent (`Danger`, `Info`, `Warning`, `Success`, `Save`), and
  behavior (`DialogClose`). `Button.Save` supplies styling only; it does not save
  or submit automatically. Inspect nearby usage and the actual class definitions;
  names alone do not establish an application's primary-action hierarchy.
- Variant names do not guarantee identical styling across families. For example,
  `Submit.Secondary` uses the bordered-gray style, while `Button.Secondary` uses
  the secondary style. Treat any alignment as an intentional visual change.
- Use `Button.DialogClose` within a dialog to share its close handler through
  `DialogContext`. Supply a localized accessible name for icon-only controls;
  `Button.Icon` and `Link.Icon` fall back from `aria-label` to `title`.
- `Atoms/wrapper.ts` supplies the `wrap()` helper used by many primitives. It merges
  classes and props and accepts `forwardRef` for the native element. Follow this
  API when composing existing atoms.

### Dialogs

`Molecules/Dialog.tsx` is the shared dialog shell, built on `react-modal` and
`react-draggable`. It owns header/content/action regions, stacking, resizing,
remembered size and position, and preference-controlled dismissal and appearance.

- Reuse `Dialog` and `dialogClassNames` for dialog layout. Prefer modal behavior;
  the implementation discourages non-modal dialogs because simultaneous workflows
  complicate accessibility and application state.
- Pass `onClose` explicitly; `undefined` represents a dialog that the user cannot
  close through the shared dismissal behavior. Pass `buttons` explicitly as well.
  A localized string renders a standard close action; JSX supplies custom actions.
- Use a stable `dimensionsKey` when the title changes during a workflow. Remembered
  dimensions otherwise derive from the header. Use `false` when persistence is
  inappropriate.
- Dialog icons can be inferred from action-button CSS classes through
  `dialogIconTriggers` in `Atoms/className.ts`. A destructive action can therefore
  give an otherwise ordinary record dialog an error icon. Specify the dialog's
  `icon` explicitly when inferred intent would be misleading.
- Preserve preferences for Escape/outside-click dismissal, motion, transparency,
  and contrast. When changing lifecycle behavior, check multiple open dialogs,
  background `inert` state, focus restoration, stacking, and retained scroll/size
  state. These are regression-sensitive interactions, not proof of existing bugs.

### Ordinary forms and configurable record forms

There are two related form systems; identify which one a change affects.

| System | Entry points | Responsibilities |
| --- | --- | --- |
| Ordinary forms | `Atoms/Form.tsx` | Native `Form`, `Label`, `Input`, `Select`, and `Textarea`; value callbacks and input behavior |
| Record form renderer | `Forms/SpecifyForm.tsx`, `FormCells/`, `FormFields/` | Render configured rows, cells, fields, and relationships against a resource |
| Record workflow | `Forms/ResourceView.tsx`, `Forms/BaseResourceView.tsx` | Compose record editing, permissions, save/delete actions, and unsaved-change handling |
| Record layout | `Atoms/DataEntry.tsx` | Grid, cells, headers, footers, subform structure, and record action icons |

The record rendering flow is view definition → `SpecifyForm` → `DataEntry`
layout → `FormCell` → field or subview. Keep configuration-driven rendering intact;
do not assume every field has a dedicated JSX call site.

- Reuse ordinary input wrappers so value conversion, blur handling, numeric-wheel
  protection, and date-entry behavior remain consistent. Follow their
  `onValueChange` and `isReadOnly` conventions where supported; a native `Select`
  does not have the same read-only API.
- Validation styling uses `not-submitted` and `not-touched` classes together with
  rules in `css/main.css`. Preserve the timing of invalid-state feedback when
  modifying submission or focus handling.
- `Form` stops submit-event propagation and prevents the default action when an
  `onSubmit` callback is provided. This matters for forms rendered inside dialog
  portals, whose React events can still bubble to a parent form.
- Record fields inherit read-only and search contexts. Preserve permission-derived
  editability, relationship behavior, required-field rules, and unsaved-change
  protection. UI read-only state does not replace backend authorization.
- For shared record-form changes, exercise a representative configured form with
  nested subviews or relationships, in addition to isolated input tests.

### Other reusable UI patterns

- `Molecules/AutoComplete.tsx` combines Headless UI with asynchronous sources,
  debouncing, and virtualization. Preserve keyboard selection, clearing, pending
  input, and empty-result behavior when changing it. Relationship selection also
  involves `QueryComboBox/`; inspect that layer for record-specific behavior.
- `Molecules/Tabs.tsx` wraps Headless UI and places an error boundary around each
  panel. Reuse its selection model rather than creating independent tab behavior.
- `Molecules/Tooltips.tsx` globally enhances `title` attributes using Floating UI.
  Use the exported delay/position attribute constants when customizing tooltips.
  Disabled elements retain native browser tooltips; essential instructions should
  also be available outside hover-only content.
- Loading patterns include `LoadingScreen`, `loadingGif`, `loadingBar`,
  `SkeletonLoaders/`, and `Atoms/Progress`. Follow the surrounding workflow and
  provide accessible status text; the decorative `loadingBar` needs a label.
- Use `Container.*` for shared page/panel structure and `TableIcon` for table or
  record identity. `ErrorMessage` and `WarningMessage` expose alert semantics;
  `ErrorBoundary` contains rendering failures.
- Tables have domain-specific implementations, including
  `QueryBuilder/ResultsTable.tsx` and `FormCells/FormTable.tsx`. Inspect selection,
  sorting, editing, and relationship requirements before extracting shared table
  behavior. Do not assume all grids share one component contract.

### Styling and component validation

Styles are distributed across `Atoms/className.ts`, `css/main.css`,
`tailwind.config.ts`, component classes, and preference-driven CSS variables. Prefer
existing tokens and variants over local overrides. Preserve dark mode, user-selected
colors and form typography, focus visibility, and reduced-motion/contrast settings.
Use localized strings for user-facing labels and accessible names.

For component behavior changes, supplement snapshots with interaction assertions.
Button and form tests live in `Atoms/__tests__/`; inspect coverage before assuming a
shared component is protected. Test affected contracts such as disabled actions,
keyboard submission, validation timing, dialog dismissal/focus, or autocomplete
selection. Use browser checks when layout, focus trapping, dragging, or resizing
cannot be meaningfully verified in jsdom. Follow the frontend checks below and
report any unverified browser behavior.

## Testing instructions

Start with the narrowest check that exercises the change. Before handoff, run the
affected module/component tests and relevant type checks. Run broader suites for
cross-cutting changes, shared infrastructure, configuration/localization changes, or
when requested. Never claim a check passed unless it was run. If a failure seems
unrelated, rerun it once and investigate whether it also occurs on unchanged code when
practical; do not weaken or delete a test to make a suite pass.

### Frontend

Run commands from `specifyweb/frontend/js_src/`:

```bash
# One test file
npm run unitTests -- lib/path/to/example.test.tsx --runInBand

# Tests related to changed source files
npm run unitTests -- --findRelatedTests lib/path/to/source.tsx --runInBand

# Jest suite, type checking, or all frontend checks
npm run unitTests
npm run typecheck
npm test

# Lint and format changed files
npx eslint path/to/changed-file.tsx
npx prettier --check path/to/changed-file.tsx
```

Frontend test conventions:

- Prefer Testing Library queries by role and accessible name. Drive interactions with
  `userEvent` and await observable updates; avoid arbitrary sleeps.
- Assert behavior, accessibility state, requests, and rendered results rather than
  React internals.
- Snapshots capture serialized render/output, not browser screenshots. Keep them focused
  and supplement them with behavioral assertions. Inspect snapshot diffs; never update
  snapshots blindly with `-u`.
- If localization resources or usages change, run `npm run localizationTests`. The full
  `npm test` command includes localization checks.

### Backend

When the development stack is running, use Django's test runner:

```bash
# One test module, class, or method
docker compose exec specify7 ve/bin/python manage.py test \
  specifyweb.backend.merge.tests.test_merging_status.TestMergingStatus.test_not_found \
  --keepdb

# One backend application or test package
docker compose exec specify7 ve/bin/python manage.py test \
  specifyweb.backend.merge.tests --keepdb

# Complete backend suite, matching CI intent
docker compose exec specify7 ve/bin/python manage.py test --verbosity=3 --keepdb

# Backend static typing targets
docker compose exec specify7 sh -lc 'VIRTUAL_ENV=./ve make typecheck'
```

For a host virtual environment, run the equivalent commands from the repository root:

```bash
ve/bin/python manage.py test specifyweb.backend.merge.tests --keepdb
VIRTUAL_ENV=./ve make typecheck
```

Replace the example test label with the one relevant to the change. Use Django test
cases, factories/fixtures, and helpers from neighboring tests. Verify authorization,
collection/division scoping, validation, and data integrity when relevant. Test Celery
task logic synchronously unless broker/worker integration is the behavior being tested.

Use `--keepdb` for iteration. Django creates a separate test database, normally
prefixed with `test_`; confirm its resolved name before database administration. Never
drop an application or production database. If test database creation is denied,
diagnose the configured MariaDB user and grant only the minimum privilege on the
explicit test database. Do not broaden grants with embedded credentials or a wildcard
unless explicitly authorized. `pytest` and `pytest-django` are available for
compatibility and focused cases, but do not replace the CI-equivalent Django command
with pytest without a repository change that also updates CI.

## Security and local environment

- Do not print, quote, commit, or expose credentials from `.env`, `.env.me`, local
  settings, database dumps, or logs.
- Do not edit personal environment files or local Compose overrides unless explicitly
  requested.
- Debugger configuration (`debugpy`, exposed ports, VS Code launch settings) is
  optional developer tooling. Do not add debugging hooks merely to run tests.

## Migrations and background jobs

- Keep database migrations isolated from unrelated feature work when feasible. Test
  forward behavior and reversal on a disposable database; document irreversibility when
  reversal is not possible.
- Do not test migrations against a master or production copy. Use a disposable database
  named for the issue or migration according to team conventions.
- Worker code runs in `specify7-worker` and uses Celery with Redis. Restart or rebuild
  the worker when its environment or image requires it. Source files are bind-mounted in
  the standard development composition, so a rebuild is not required for every edit.

## Issues, feature requests, and planning

When investigating bugs, defining features, or planning substantial changes, start
with any issue, discussion, or prior decision supplied by the user. Search for
additional context as needed in existing open and closed
[issues](https://github.com/specify/specify7/issues),
[discussions](https://github.com/specify/specify7/discussions), related pull requests,
and relevant [Speciforum](https://discourse.specifysoftware.org) topics. Search by
symptom, affected component, error text, and alternative names for the feature. Read
linked conversations and prior decisions; include relevant links in the work plan
and eventual issue or PR. Reuse existing tracking rather than creating duplicates.
Routine documentation edits and straightforward fixes with sufficient supplied
context do not require a broader search. If a needed source is inaccessible, state
that limitation instead of claiming no related work exists.

### From community feedback to tracked work

- SCC community members are encouraged to report problems or request help in
  [Speciforum Get Help](https://discourse.specifysoftware.org/c/get-help/78) and
  suggest enhancements in
  [Speciforum New Features](https://discourse.specifysoftware.org/c/new-features/37).
  A GitHub account is not required for this initial feedback.
- SCC staff consolidate community feature requests into GitHub Discussions and add
  bugs to GitHub Issues as needed. Discussions are largely open-ended
  conversations where requirements can develop; community feedback primarily stays
  on Speciforum. Preserve links to the originating community topics.
- Once a requested change is selected for implementation and sufficiently defined,
  convert or link its discussion to a GitHub Issue with concrete requirements.
  Issues track actionable bugs, defined features, and tasks, with assignment,
  labels, milestones, and progress managed by the team. A discussion alone is not
  a commitment to implement a feature.

### Issue templates and implementation plans

Use the repository's current templates when preparing an issue:

- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md): describe the actual and expected
  behavior, reproducible steps, screenshots where useful, and the reporting
  institution. Include the requested environment details: OS, browser, exact Specify
  version, database, collection, user, and URL. For a production/development report,
  attempt reproduction on the latest tagged release (`v7`) and report whether it is
  a regression. Attach the downloaded error report, or System Information when
  there is no error, after checking for sensitive information. Mark unknown or
  unavailable details honestly; do not invent them.
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.md): explain the user
  problem, desired solution, alternatives considered, reporting institution, and
  supporting context. Link the preceding discussion and community feedback.
- [Task](.github/ISSUE_TEMPLATE/task.md): Define the specific work, scope, completion 
  criteria, dependencies, and related issues or discussions so completion can be verified.

Before substantial implementation, summarize the requirements, intended approach,
affected areas, and validation plan. Identify unresolved decisions and dependencies.
Keep the plan proportional to the work; a small fix needs only a short explanation.
Keep issue requirements and PR descriptions aligned with the final scope. Drafting
tracking material locally does not require publishing it; create or modify remote
issues and discussions only within the user's authorized scope.

## CodeRabbit CLI review

After CodeRabbit is installed and authenticated locally, run it from the repository
root before handing off code changes. Check the installed CLI first:

```bash
coderabbit --version
coderabbit auth status
coderabbit review --help
```

Use the applicable scope (replace `BASE_BRANCH` with the intended PR target):

```bash
# Uncommitted changes
coderabbit review --agent --uncommitted

# Branch changes against the PR target
coderabbit review --agent --base BASE_BRANCH

# Include new files that Git is not tracking yet
coderabbit review --agent --uncommitted --include-untracked
```

Current syntax uses `--agent`; check installed help rather than copying older
`--prompt-only` examples. Tracked changes are included by default; untracked files
need `--include-untracked`. See the
[official CLI reference](https://docs.coderabbit.ai/cli/reference).

Review the selected diff first: exclude secrets and unrelated local work. CodeRabbit
sends code to its service. Evaluate findings against the requirements and tests;
fix valid, in-scope problems, rerun affected checks, and review fixes once more.
Explain dismissed or deferred findings. Avoid unbounded review loops. CodeRabbit
supplements self-review, tests, and human review.

Wait for completion and report the command, scope, outcome, and remaining findings.
Partial output is not a completed review. If setup, authentication, or limits block
review, report the limitation; do not claim it passed or add `--use-credits` without
spending authorization.

## Pull requests and delivery

- Use [.github/pull-request-template.md](.github/pull-request-template.md) when
  drafting or opening a PR. Confirm the intended target branch rather than assuming
  a default. Give the PR a concrete title and explain the problem and resulting
  behavior, with links to the issue and relevant discussions.
- Replace `Fixes #` with the actual issue reference only when the PR resolves it.
  Use a non-closing reference such as `Refs #123` for partial or related work; do not
  leave a bare placeholder or invent an issue number.
- Work through the template checklist honestly: self-review the opened PR, relevant
  issue release milestone, documentation list entry, automated tests, reverse
  migration, and migration-function registration. Check items only when completed;
  explain items that do not apply. Flag milestone/documentation follow-up for the
  maintainer when it is outside the authorized scope.
- For migrations, enable the template's migration warning and follow its linked
  testing instructions. Check whether a reverse migration and registration in
  `specifyweb/specify/management/commands/run_key_migration_functions.py` apply to
  the change; document any irreversible behavior.
- Fill in the Testing instructions section with prerequisites, reproducible steps,
  and expected results. Include automated coverage and any manual checks still
  needed. Use a draft PR when work or validation remains incomplete.
- After opening or updating an authorized PR, inspect its diff and CI results,
  address actionable review feedback, and rerun checks affected by further edits.
  Report unresolved failures or decisions before declaring it ready for review.

- Review the final diff for generated files, secrets, debug statements, broad formatting,
  and unrelated changes.
- Report the exact checks run and their outcomes, along with relevant checks not run and
  the reason. Provide generic, repeatable testing instructions rather than instructions
  tied to a private database.
- For bug fixes, describe the cause and how the fix addresses it. Call out migrations,
  worker behavior, configuration changes, security implications, and
  user-visible/localization effects when relevant.
- Do not merge, push, publish, alter milestones, or contact reviewers unless asked.
