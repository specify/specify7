# Weblate Localization

This branch stores translations produced though the Weblate interface.

This branch should not be modified manually.

On any changes to `main` branch, the strings in the branch
will be synchronized though a GitHub Action.

When strings are modified in Weblate, changes will be pushed to this
branch and then synchronized back with `production` using GitHub Action.

## Why this solution

This two step process is required because Weblate does not support
the localization format we store the strings in.

The closest format that Weblate supports is monolingual JSON files.

Unfortunately, we can't use them as TypeScript does not support const
imports for JSON files (see
https://github.com/microsoft/TypeScript/issues/32063)

Weblate does support writing custom add-ons, but only when
self-hosting. We are aiming for using their hosting.
