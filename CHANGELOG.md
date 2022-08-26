# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Unreleased

### Fixed

- Fix SubView Grid for dependent relationships displaying only first 20
  items ([#1936](https://github.com/specify/specify7/issues/1936))
- Fix filters for some picklists disappear from queries in the
  UI. ([#1934](https://github.com/specify/specify7/issues/1934))
- Fix text fields with the `uitype="checkbox"` being always
  checked ([#1929](https://github.com/specify/specify7/issues/1929))
- Cannot export distinct query results to
  CSV ([#1956](https://github.com/specify/specify7/issues/1956))
- Fix SubView's `sortField` being
  ignored ([#1872](https://github.com/specify/specify7/issues/1872))
- Fix Query Builder not supporting European date
  format ([#1908](https://github.com/specify/specify7/issues/1908))
- Fix poor WorkBench rollback performance
  back ([#1663](https://github.com/specify/specify7/issues/1663))
- Fix changes not being preserved for embedded Collecting Events ([#1704](https://github.com/specify/specify7/issues/1704))

Minor fixes:

- Fix inconsistent wording in boolean dropdowns in Query Builder ([#1931](https://github.com/specify/specify7/issues/1931))
- Fix WB crashing on some permission errors ([#1932](https://github.com/specify/specify7/issues/1932))
- Fix unable to remove record from record set on no record delete permission ([#1937](https://github.com/specify/specify7/issues/1937))
- Fix unable to empty a field assigned to a non-read only pick list ([#1924](https://github.com/specify/specify7/issues/1924))
- Fix Query Builder marking some non-hidden fields as hidden ([#1894](https://github.com/specify/specify7/issues/1894))
- Fix table formatters displaying separators for empty fields ([#1873](https://github.com/specify/specify7/issues/1873))
- Fix "Value is not defined" error on WB record disambiguation ([#1878](https://github.com/specify/specify7/issues/1878))
- Fix Query Builder exposing front-end only fields ([#1896](https://github.com/specify/specify7/issues/1896))
- Fix opening WbPlanView when "Results" is open crashing WB ([#1898](https://github.com/specify/specify7/issues/1898))
- Fix unable to unset a value from a pick list ([#1892](https://github.com/specify/specify7/issues/1892))
- Fix forms not supporting European date format ([#1875](https://github.com/specify/specify7/issues/1875))
- Fix forms not supporting relative date as default ([#1874](https://github.com/specify/specify7/issues/1874))
- Fix Query Builder allowing to negate an "Any" filter ([#1876](https://github.com/specify/specify7/issues/1876))
- Fix sorting by QB results table header not working when some fields are hidden ([#1880](https://github.com/specify/specify7/issues/1880))
- Fix WB not handling nicely pick list values over length limit ([#1837](https://github.com/specify/specify7/issues/1837))
- Fix QB crashing on invalid DataObjFormatter definitions ([#1675](https://github.com/specify/specify7/issues/1675))
- Fix Specify 7 query stringids not match Specify 6 ([#724](https://github.com/specify/specify7/issues/724))
- Fix front-end not showing HTML error messages ([#1652](https://github.com/specify/specify7/issues/1652))
- Fix accessibility issue with dialog headings ([#1413](https://github.com/specify/specify7/issues/1413))
- Fix accessibility issue with autocomplete ([#1986](https://github.com/specify/specify7/pull/1986))

### Added

- Fetch pick lists on demand ([#1988](https://github.com/specify/specify7/pull/1988))
- Allow limiting the heigh of SubView Grid
  ([#290](https://github.com/specify/specify7/issues/290))
- Allow making form fields
  invisible ([#1070](https://github.com/specify/specify7/issues/1070))
- Rename "Add Another" to "
  Add" ([#1922](https://github.com/specify/specify7/issues/1922))
- Add ability to modify some Locality
  Preferences ([#159](https://github.com/specify/specify7/issues/159))
- Display Git Hash in the Specify "About"
  dialog ([#1980](https://github.com/specify/specify7/issues/1980))
- Make autocomplete search algorithm
  configurable ([#1921](https://github.com/specify/specify7/issues/1921)
  , [#1935](https://github.com/specify/specify7/issues/1935))
- In one to many displays in grid form, add border around each record ([#1933](https://github.com/specify/specify7/issues/1933))
- Extend localization tests to catch misplaced strings ([#1739](https://github.com/specify/specify7/issues/1739))

## [7.7.0](https://github.com/specify/specify7/compare/v7.6.1...v7.7.0) (1 July 2022)

7.7.0 is a major release with hundreds of bug fixes and new features.

### Added

- Added Security and Permissions system
- Added Single-Sign-On support
- Added Schema Editor

### Changed

- Redesigned the User Interface
- Significantly improved accessibility
- Redesigned Query Builder
- Redesigned Tree Viewer
- Redesigned Attachments Viewer

[Full list of new features and bug fixes](./release-notes/7.7.0.md)

## [7.6.1](https://github.com/specify/specify7/compare/v7.6.0...v7.6.1) (1 November 2021)

### Fixed

- Fixes typo in
  README. [#956](https://github.com/specify/specify7/issues/956)
- Fixes menu overflow on some screens.
- Fixes regression in regex
  uiformatter. [#1010](https://github.com/specify/specify7/issues/1010)
- Fixes tree level
  titles. [#740](https://github.com/specify/specify7/issues/740)
- Fixes _From Record Set_ dialog having wrong button
  label. [#1026](https://github.com/specify/specify7/issues/1026)
- Fixes Workbench upload/validation handling of over length
  values. [#1041](https://github.com/specify/specify7/issues/1041)
- Fixes Workbench mapping of _OtherIdentifier_
  table. [#1029](https://github.com/specify/specify7/issues/1029)

### Security

- Updates version of Python Requests
  library. [#1005](https://github.com/specify/specify7/issues/1005)
- Updates README to require Ubuntu 20.04.

## [7.6.0](https://github.com/specify/specify7/compare/v7.5.0...v7.6.0) (16 September 2021)

7.6.0 is a major release with a new Workbench and improved API documentation.

[Full list of new features and bug fixes](./release-notes/7.6.0.md)

## [7.5.0](https://github.com/specify/specify7/compare/v7.4.0...v7.5.0) (1 September 2020)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.4.0...v7.5.0)

## [7.4.0](https://github.com/specify/specify7/compare/v7.3.1...v7.4.0) (18 April 2020)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.3.1...v7.4.0)

## [7.3.1](https://github.com/specify/specify7/compare/v7.3.0...v7.3.1) (10 June 2019)

### Fixed

- Resolved an issue that was preventing the use of images in
  reports. ([#437](https://github.com/specify/specify7/issues/437),
  [#492](https://github.com/specify/specify7/issues/492))
- Table formatters for CatalogNumber now correctly override specification
  defined in schema localization.
  ([#488](https://github.com/specify/specify7/issues/488)
  , [#430](https://github.com/specify/specify7/issues/430)
  , [#292](https://github.com/specify/specify7/issues/292))
- 'Contains' and 'Like' operators now active for the CatalogNumber field in
  the Query
  Builder. ([#487](https://github.com/specify/specify7/issues/487))
- Weblinks to external resources like GenBank now link out without regard to
  capitalization of the Specify
  field names
  involved. ([#486](https://github.com/specify/specify7/issues/486))
- Specify data fields formatted to type 'anychar' are now handled correctly
  by field
  formatters. ([#485](https://github.com/specify/specify7/issues/485))
- Passwords for Specify 7 users now work correctly with Unicode
  characters. (But Specify 6 passwords
  with non-ASCII characters will prevent Specify 6
  logins.) ([#484](https://github.com/specify/specify7/issues/484))
- Specify 7 reports will now work when a linked Specify Attachment Server is
  inaccessible. ([#482](https://github.com/specify/specify7/issues/482))
- When dates are entered partially, Specify no longer assigns current date
  information to the missing parts.
  ([#471](https://github.com/specify/specify7/issues/471)
  , [#481](https://github.com/specify/specify7/issues/481))
- An address is no longer required when using a 'Shipped To'
  Agent. ([#474](https://github.com/specify/specify7/issues/474))
- Specify WorkBench now reports the correct number of records uploaded,
  previously counts were off by
  one. ([#466](https://github.com/specify/specify7/issues/466))
- During WorkBench record uploads, Specify 7 checks to see if incoming data
  values are already present in
  related tables in the database. For example incoming Locality information
  in a Collection Object record
  upload, is checked against existing records in the Locality table. If a
  matching record is found, previously

  Specify offered the option to 'Skip' (do not upload the entire WorkBench
  row) or 'Use First' to link the
  uploaded information to the first existing (Locality) record it matched.

  Another option 'Add New' is now
  available if a match is found with an existing related data table, to
  create a new record for that data in the
  related table. ([#465](https://github.com/specify/specify7/issues/465))

- During WorkBench uploads, when the 'Use First' option is selected, when
  data in a particular uploaded
  field matches multiple existing records, Specify will now correctly link
  the incoming record to the first
  related record it finds for that particular
  field. ([#464](https://github.com/specify/specify7/issues/464))
- Customized field labels that contain character strings that meet the
  requirements for 'regular expressions'
  (a specialized syntax and sequence of characters that define a string
  search pattern), are now treated as just
  strings and do not break Specify 7's data
  forms. ([#463](https://github.com/specify/specify7/issues/463))
- Unicode characters now display correctly in customized data
  forms. ([#461](https://github.com/specify/specify7/issues/461))
- Saving new Agent records with Agent specialty information now works
  correctly. ([#460](https://github.com/specify/specify7/issues/460)
  , [#151](https://github.com/specify/specify7/issues/151))
- Lat/Long values can now be
  deleted. ([#452](https://github.com/specify/specify7/issues/452))
- Reports run using RecordSets as inputs, now use just the records in the
  RecordSet. ([#449](https://github.com/specify/specify7/issues/449))
- Queries on Taxon now run properly when they contain a Rank's
  GroupNumber. ([#445](https://github.com/specify/specify7/issues/445))
- When selecting a record in a query combo box drop down list (magnifying
  glass icon), the record selected
  is now the one linked to the
  record. ([#440](https://github.com/specify/specify7/issues/440)
  , [#329](https://github.com/specify/specify7/issues/329))
- TaxonFullName is now displayable for Current Determination in Loan Item
  subforms. ([#385](https://github.com/specify/specify7/issues/385))
- An authentication process incompatibilty between Specify 7, SQL Alchemy,
  and MySQL 8.x is resolved.

  Specify 6 does not yet support MySQL 8. ([#476](https://github.com/specify/specify7/issues/476))

## [7.3.0](https://github.com/specify/specify7/compare/v7.2.1...v7.3.0) (12 October 2017)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.2.1...v7.3.0)

## [7.2.1](https://github.com/specify/specify7/compare/v7.2.0...v7.2.1) (26 April 2017)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.2.0...v7.2.1)

## [7.2.0](https://github.com/specify/specify7/compare/v7.1.0...v7.2.0) (19 September 2016)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.1.0...v7.2.0)

## [7.1.0](https://github.com/specify/specify7/compare/v7.0.4...v7.1.0) (6 April 2016)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.0.4...v7.1.0)

## [7.0.4](https://github.com/specify/specify7/compare/v7.0.3...v7.0.4) (1 October 2015)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.0.3...v7.0.4)

## [7.0.3](https://github.com/specify/specify7/compare/v7.0.2...v7.0.3) (10 July 2015)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.0.2...v7.0.3)

## [7.0.2](https://github.com/specify/specify7/compare/v7.0.1...v7.0.2) (27 May 2015)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.0.1...v7.0.2)

## [7.0.1](https://github.com/specify/specify7/compare/v7.0.0...v7.0.1) (20 April 2015

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.0.0...v7.0.1)

## [7.0.0](https://github.com/specify/specify7/commits/v7.0.0) (22 December 2014)

[Bug fixes and new features](https://github.com/specify/specify7/commits/v7.0.0)
