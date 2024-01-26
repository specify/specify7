# Schema Localization

This folder containers the scripts for integrating Specify schema localization
with weblate. The
[schema localization itself](https://github.com/specify/specify6/blob/master/config/schema_localization.xml)
is housed in Specify 6 repository at the moment, but with Specify 6 being
deprecated in the future, that will hopefully be moved into this repository.

## How it works

Pre-requisite: read how Specify 7 localization and integration with weblate
works.

Good sources:

- [Localization Documentation](../README.md)
- README in the branch that stored weblate metadata:
  https://github.com/specify/specify7/tree/weblate-localization#readme
- The Weblate related portion of the test.yml file. [Link to that portion of
  code]
  (https://github.com/specify/specify7/blob/8462d9bbe2bac448b2fcf56308d0298d4cc70604/.github/workflows/test.yml#L165-L210)
  (note, this is a permalink, thus the code in question may be updated, yet the
  link will still show older version)

Specify 6 localization works in a similar way: there is a branch that is used by
weblate only and acts as an intermediate between the Specify 6 file and weblate.
There is also two way synchronization on changes using GitHub actions.
