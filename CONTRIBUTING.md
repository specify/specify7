# Guide to contributing to Specify Software

Thank you for the interest in contributing to Specify's codebase! We welcome
contributions of all kinds, including bug fixes, improvements, documentation,
etc.

We value contributions from all members of the community, regardless of
experience level. Whether you are a seasoned open source contributor or a
newcomer to the world of software development, your help is greatly appreciated.

To get started with contributing to Specify 7, this guide will provide you with
the information you need to understand the project, its goals, and how you can
help.

We also encourage you to reach out to the Specify 7 team with any questions you
may have. You can contact the team at support@specifysoftware.org.

## Mission Statement

The mission of the Specify Collections Consortium is to advance research and
applied uses of the information associated with specimens and samples held in
biological and earth science collections. With engagement and collaboration from
its member institutions, the Consortium does this by engineering innovative,
open-source software, and by offering training and services to members for the
digitization, integration, and curation of collections data. By collaboratively
creating and supporting robust platforms and tools, the Consortium advances the
mobilization and engagement of collections data in broader research and
computing initiatives for the benefit of its members, science, and society.

_Our mission statement serves as a guiding principle for how our organization
should operate. It defines what our organization stands for, what it values, and
what its goals are. By developing in accordance with our mission statement, we
ensure that our efforts are aligned with our core values and purpose. This helps
us stay focused on our goals, and ensures that all of our efforts are working
together to achieve our mission._

## Getting Started

Preferred way to do Specify 7 development is though our development
composition.

[Documentation for getting development Docker composition
working](https://github.com/specify/specify7/wiki/Docker-Workflow-for-Development)

## Issue Tracking

All feature requests and bugs are tracked on GitHub. Each issue is sorted into a
project. Each project represents a major Specify 7
component. [A list of all projects](https://github.com/specify/specify7/projects?type=classic)

If you found a bug, feel free to open a GitHub issue. Similarly, if you are
interested in fixing some issue or adding new feature, feel free to do so!
If you want to work on a larger feature, it would be best if you [get in touch
with us](mailto:support@specifysoftware.org) first so that we can make sure the
process is smooth and efficient.

Our entire workflow for reporting bugs, trianging them, prioritizing the fixes,
testing them and releasing the
fixes - https://github.com/specify/specify7/wiki/Issue-Workflow

You don't have to read every part of that document, but some of the sections in
that document would be relevant

Example workflow:

1. Go through GitHub Projects
2. Find a ticket that you are interested in resolving
3. Fix it in a local fork of Specify 7
4. Open a pull request in Specify 7 repository. In the pull request, mention
   the issue you are solving by putting `Fixes #1234` in the description, where
   `1234` is a number of GitHub issue
5. We will review the changes and merge them into next release. You will receive
   credit in the release notes!
   
### First Steps

It's recomended to start with issues that are labled with
[good first issue](https://github.com/specify/specify7/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
as those require less knowledge of the codebase and are as not urgent. These
would prepare you for taking on larger GitHub issues.

## Code Documentation

### Front-End

On the front-end, we are using TypeScript, React and Tailwind CSS.

Front-end root directory is
in [./specifyweb/frontend/js_src](https://github.com/specify/specify7/tree/testability/specifyweb/frontend/js_src)

Each folder and sub-folder has a README.md file that describes the role of that
directory and provides other meta information.

We have a [video of a full front-end code overview from January 2023 available here](https://drive.google.com/file/d/11TDHSz54EhQ5eQPNyaogHOODO8_8Q9yg/view).

## Back-End

Back-end uses Python and Django. It also works closely with a MySQL/MariaDB
database both though Django ORM and though SQLAlchemy.

Back-end root directory
is [./specifyweb/](https://github.com/specify/specify7/tree/production/specifyweb)

## IDE Setup

No special IDE configuration is required, but some optional plugins would
improve developer
experience - https://github.com/specify/specify7/tree/production/specifyweb/frontend/js_src#js_src

That document includes a short list. For a full list,
see https://github.com/specifysystems/code-principles

In the browser, you can install React Devtools extension to make debugging React
components easier.

## Code-Style

We prefer functional programming paradigm. In our opinion, perfect code\*
consist
of small and pure functions that have clear unit tests, and can be combined
together to solve a complex task.

> \*no code is perfect, but you can still strive for it

On a static analysis side, we use strict TypeScript type checking and Prettier
formatting to make code less buggy and more consistent.

Additionally, ESLint goes beyond that to provide close to a thousand of static
analysis checks and quick fixes, all in a name of clear and bug-free code. Our
ESLint configuration is located
in [@maxxxxxdlp/eslint-config-react](https://www.npmjs.com/package/@maxxxxxdlp/eslint-config-react)

## Test Panel

[Specify 7 Test Panel](https://github.com/specify/specify7-test-panel) is used
for testing bug fixes and pre-release versions of Specify 7.

Once up and running, the test panel can be operated by non-technical users.

If set up properly, it automatically rebuilds all active deployments when
someone pushes new changes on GitHub. It also automatically deploys bug fixes
once those are marked as ready for testing.

The test panel is designed for usage by Quality Assurance people, but could also
be used by external users for quick evaluation or developers when they need to
quickly deploy an older version of Specify to compare behavior.

## Support

A great deal of user-facing documentation is available at
our [Discourse forum](https://discourse.specifysoftware.org/). Most of it is
available to users from member institutions only, thus [consider joining the
Specify Software Consortium](https://www.specifysoftware.org/membership-levels/)
if you are interested in becoming a power user of Specify 7.

Besides the README.md files in most folders in this repository, there is also
some developer facing documentation in
our [GitHub Wiki](https://github.com/specify/specify7/wiki).

If you are stuck and need help, consider emailing our support
at [support@specifysoftware.org](mailto:support@specifysoftware.org),
opening a [GitHub issue](https://github.com/specify/specify7/issues/new/choose)
or posting a question on
our [Discourse forum](https://discourse.specifysoftware.org/)
as appropriate.

| Contact Option  | Link                                                                  |
| --------------- | --------------------------------------------------------------------- |
| General Inquiry | [support@specifysoftware.org](mailto:support@specifysoftware.org)     |
| Bug Report      | [GitHub Issue](https://github.com/specify/specify7/issues/new/choose) |
| User Question   | [Discourse Forum](https://discourse.specifysoftware.org/)             |
