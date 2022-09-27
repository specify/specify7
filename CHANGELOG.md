# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [7.7.3](https://github.com/specify/specify7/compare/v7.7.2...7.7.3) (26 September 2022)

### Added

- You can now upload `GUIDs` for tree tables though the
  WorkBench ([#2097](https://github.com/specify/specify7/issues/2097))
- Support customizing CO formatter in ColRels Plugin ([#2157](https://github.com/specify/specify7/pull/2157))

### Changed

- Pick List size limit is no longer enforced
  ([#1025](https://github.com/specify/specify7/issues/1025)) -
  _Requested by RGBE and others_

### Fixed

- Fix list of tables pick list not working on form
  load ([#2146](https://github.com/specify/specify7/issues/2146))
- Fix an error when creating Funding Agent records
  ([#715](https://github.com/specify/specify7/issues/715)) - _Reported
  by CSIRO_
- Fix for focus loss when using Query Combo Box without a mouse
  ([#2142](https://github.com/specify/specify7/issues/2142)) - _Reported
  by RGBE_
- Fix Query Combo Box displaying "Add" for users that don't have
  permission to create related record
  ([#2216](https://github.com/specify/specify7/issues/2216))
- Fix error when adding Address of Record SubView to Borrow form
  ([#2006](https://github.com/specify/specify7/pull/2006)) -
  _Reported by CSIRO_
- Fix list of tables pick list not working on form
  load ([#2146](https://github.com/specify/specify7/issues/2146))
- Fix "Create Invite Link" having incorrect condition ([#2140](https://github.com/specify/specify7/pull/2140))
- Using invalid field names in checkboxes no longer breaks the form
  ([#2200](https://github.com/specify/specify7/issue/2200))

## [7.7.2](https://github.com/specify/specify7/compare/v7.7.1...v7.7.2) (12 September 2022)

### Added

- Allow customizing SubView grid column
  widths ([#2035](https://github.com/specify/specify7/pull/2035))
- Allow customizing tree search
  algorithm ([#2001](https://github.com/specify/specify7/issues/2001))
- Added credits to institutions in the `CHANGELOG.md`
  file ([#2071](https://github.com/specify/specify7/issues/2071))

### Changed

- Rewrite Autocomplete to use HeadlessUI
  library ([#1986](https://github.com/specify/specify7/issues/1986))
- Fetch pick lists on
  demand ([#1988](https://github.com/specify/specify7/pull/1988))

### Fixed

- Fixed `taxonId` field on the forms not getting
  populated ([#2083](https://github.com/specify/specify7/issues/2083))
- Fixed `ExsiccataItem` table being hidden in the
  WorkBench ([#2077](https://github.com/specify/specify7/issues/2077)) - _Reported by CSIRO_
- Fix `Taxon.taxonId` field not getting
  populated ([#2087](https://github.com/specify/specify7/pull/2087))
- Don't use underscore for partial date
  fields ([#2066](https://github.com/specify/specify7/pull/2066))
- Convert "text" -> "java.lang.String" when creating report from
  query ([#2059](https://github.com/specify/specify7/pull/2059))
- Fix Sp7.7 not parsing QCB's TypeSearch
  correctly ([#2026](https://github.com/specify/specify7/pull/2026))
- Fix Schema Config failing on no description
  strings ([#2024](https://github.com/specify/specify7/pull/2024))

## [7.7.1](https://github.com/specify/specify7/compare/v7.7.0...v7.7.1) (29 August 2022)

### Added

- Allow limiting the height of SubView
  Grid ([#290](https://github.com/specify/specify7/issues/290))
- Allow making form fields
  invisible ([#1070](https://github.com/specify/specify7/issues/1070))
- Rename "Add Another" to "
  Add" ([#1922](https://github.com/specify/specify7/issues/1922)) - _Reported by
  RBGE_
- Add ability to modify some Locality
  Preferences ([#159](https://github.com/specify/specify7/issues/159)) - _Reported by CSIRO_
- Display Git Hash in the Specify "About"
  dialog ([#1980](https://github.com/specify/specify7/issues/1980)) - _Reported
  by RBGE_
- Make autocomplete search algorithm
  configurable ([#1921](https://github.com/specify/specify7/issues/1921)
  , [#1935](https://github.com/specify/specify7/issues/1935)) - _Reported by RBGE_
- In one to many displays in grid form, add border around each
  record ([#1933](https://github.com/specify/specify7/issues/1933))
- Extend localization tests to catch misplaced
  strings ([#1739](https://github.com/specify/specify7/issues/1739))

### Fixed

- Fix SubView Grid for dependent relationships displaying only first 20
  items ([#1936](https://github.com/specify/specify7/issues/1936)) - _Reported
  by RBGE_
- Fix filters for some pick lists disappear from queries in the
  UI. ([#1934](https://github.com/specify/specify7/issues/1934)) - _Reported by
  RBGE_
- Fix text fields with the `uitype="checkbox"` being always
  checked ([#1929](https://github.com/specify/specify7/issues/1929))
- Cannot export distinct query results to
  CSV ([#1956](https://github.com/specify/specify7/issues/1956)) - _Reported by
  CSIRO_
- Fix SubView's `sortField` being
  ignored ([#1872](https://github.com/specify/specify7/issues/1872)) - _Reported
  by RBGE_
- Fix Query Builder not supporting European date
  format ([#1908](https://github.com/specify/specify7/issues/1908)) - _Reported
  by RBGE_
- Fix poor WorkBench rollback performance
  back ([#1663](https://github.com/specify/specify7/issues/1663))
- Fix changes not being preserved for embedded Collecting
  Events ([#1704](https://github.com/specify/specify7/issues/1704))

Minor fixes:

- Fix inconsistent wording in boolean drop-downs in Query
  Builder ([#1931](https://github.com/specify/specify7/issues/1931)) - _Reported
  by RBGE_
- Fix WB crashing on some permission
  errors ([#1932](https://github.com/specify/specify7/issues/1932)) - _Reported
  by KU Mammals_
- Fix unable to remove record from record set on no record delete
  permission ([#1937](https://github.com/specify/specify7/issues/1937))
- Fix unable to empty a field assigned to a non-read only pick
  list ([#1924](https://github.com/specify/specify7/issues/1924)) - _Reported by
  KE Herbarium_
- Fix Query Builder marking some non-hidden fields as
  hidden ([#1894](https://github.com/specify/specify7/issues/1894)) - _Reported
  by RBGE_
- Fix table formatters displaying separators for empty
  fields ([#1873](https://github.com/specify/specify7/issues/1873)) - _Reported
  by RBGE_
- Fix "Value is not defined" error on WB record
  disambiguation ([#1878](https://github.com/specify/specify7/issues/1878))
- Fix Query Builder exposing front-end only
  fields ([#1896](https://github.com/specify/specify7/issues/1896))
- Fix opening WbPlanView when "Results" is open crashing
  WB ([#1898](https://github.com/specify/specify7/issues/1898))
- Fix unable to unset a value from a pick
  list ([#1892](https://github.com/specify/specify7/issues/1892))
- Fix forms not supporting European date
  format ([#1875](https://github.com/specify/specify7/issues/1875)) - _Reported
  by Cornell University_
- Fix forms not supporting relative date as
  default ([#1874](https://github.com/specify/specify7/issues/1874)) - _Reported
  by RBGE_
- Fix Query Builder allowing to negate an "Any"
  filter ([#1876](https://github.com/specify/specify7/issues/1876))
- Fix sorting by QB results table header not working when some fields are
  hidden ([#1880](https://github.com/specify/specify7/issues/1880)) - _Reported
  by RBGE_
- Fix WB not handling nicely pick list values over length
  limit ([#1837](https://github.com/specify/specify7/issues/1837))
- Fix QB crashing on invalid DataObjFormatter
  definitions ([#1675](https://github.com/specify/specify7/issues/1675))
- Fix Specify 7 query stringids not match Specify
  6 ([#724](https://github.com/specify/specify7/issues/724))
- Fix front-end not showing HTML error
  messages ([#1652](https://github.com/specify/specify7/issues/1652))
- Fix accessibility issue with dialog
  headings ([#1413](https://github.com/specify/specify7/issues/1413))
- Fix accessibility issue with
  autocomplete ([#1986](https://github.com/specify/specify7/pull/1986))

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

> Software Releases: Specify 6.8.00, Specify 7.4.00, Specify Web Server 2.0

The Specify Collections Consortium is pleased to announce updates for Specify 6,
Specify 7, and the Specify Web Portal. The new releases include database schema
enhancements, new capabilities, and a large number of fixed bugs. Database
administrators note with these updates: (1) the Specify 6 updater modifies the
Specify database schema, and (2) the updates create new dependencies among the
three packages (Specify 6, 7, and Web Portal) that are not backward compatible
with previous releases. Specify 6.8 and Specify 7.4 work with the new database
schema update (ver. 2.7), the Specify 6 installer adds tables to the database,
and adds or changes fields in others. (See the Specify 6 release notes for more
information.)

We are committed to keeping the SCC’s development and support activities moving
forward during this extraordinary, global hiatus, and hope to return to our
Consortium offices later in the year. In the meantime, make contact if we can
help. E-mail is the best way to reach us for most things:
support@specifysoftware.org. We would be happy to set up a conversation, over
the phone or launch a Zoom or Skype session, on Specify matters large or small.

### Summary of New Capabilities

A significant new module in Specify 6 and 7 provides support for recording all
changes made to a database, including record additions, edits, and deletions.
“Audit Logging” is a background process that records every change to data along
with metadata on who made it and when.

The status of Loan transactions can be tracked more efficiently using new data
fields that summarize the disposition of loaned items (cataloged or
uncatalogued) on the Loan form.

We added a second link connecting the Storage Tree and the Preparation table in
order to provide the possibility for designating a second or alternate storage
location for a Preparation.

In an earlier Specify 6 release, we added two new tables: Collection Object
Properties and Preparation Properties, to handle attribute or trait data for
Collection Objects and Preparations, respectively. These new data tables allow a
researcher to choose the attribute being described or measured at the time of
data entry, e.g. from a drop-down pick list, and then record the corresponding
value in a second, associated field. This extensible design makes the number of
attribute types that can be recorded essentially limitless. Attributes are
variables that can be defined as logical (presence/absence, yes/no, etc.),
categorical, or quantitative. Values are represented in the database as logical,
text, integer, or floating point data. Members are invited to contact the SCC
Lab for additional information on how to configure these tables for trait data.

We implemented two Cyrillic language translations of Specify, Russian and
Ukrainian. The localizations are available for Specify 6.8. Contact us for setup
information if you are interested in using them.

With the Specify 6.8 and 7.4 updates, we confirm compatibility and support for
MariaDB, a popular open-source, relational database platform and alternative to
MySQL.

Specify 6.8 is Apple notarized by Apple to run on macOS 10.14 (Mojave), and
10.15 (Catalina).

The Specify Web Portal can now ingest, search, and display Collection Object
records from multiple Specify collections. We also changed the way the Specify 6
and 7 platforms export data to the Web Portal, and improved search behavior in
the Portal when using quoted phrases.

Additionally, URLs in Specify weblink data fields published to the Web Portal
can now be made live; public web users can click them to retrieve linked remote
resources.

With Specify 7.4, in addition to adding support for Audit Logging, we fixed a
number of issues (below). We are updating Specify 7 modules to Python 3 and
Django 2.2 in the next release.

### Sources

Specify 6.8.00: https://www.specifysoftware.org/join/download/
Specify 7.4.00: https://github.com/specify/specify7/releases/tag/v7.4.0
Specify Web Portal
2.0: https://github.com/specify/webportal-installer/releases/tag/v2.0

### Bugs Fixed

Specify 6.8.00 addresses over 135 engineering issues, about 50 user-facing. The
list is at: https://github.com/specify/specify6/milestone/5
Specify 7.4.00 listing of fixed
bugs: https://github.com/specify/specify7/milestone/16
Specify Web Portal 2.0 fixed
bugs: https://github.com/specify/webportal-installer/issues?q=is%3Aopen+is%3Aissue+label%3A%22Confirmed+Fixed%22

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

The Specify Project is pleased to announce updates to the Specify 6 & Specify 7
collection management platforms. Several months in the making, these releases
address numerous issues and new capabilities.
The [Specify 6 download page](https://www.specifysoftware.org/join/download/)
has release information, the Release Notes file contains details on Specify 6
enhancements. Specify 7 uses the same database schema as Specify 6, for schema
changes affecting both platforms see “Database Schema Changes” in the Specify
6.6 Release
Notes. [A list of issues fixed in Specify 7](https://github.com/specify/specify7/issues?q=is%3Aissue+is%3Aopen+label%3Afor-release-notes)
. Specify 7.3 source code is obtainable from
the [Specify Project GitHub site](https://github.com/specify/specify7). The
Specify Project is enthused to deliver these new releases that resulted from
collaborations with the Global Genome Biodiversity Network and the University of
Texas.

Institutions using Specify 6 and Specify 7 simultaneously will need to update
both platforms to continue providing database access.

If we can help you evaluate Specify for your collection, please contact us. We
would be happy to advise on that or other Specify issues.

### Overview of new features

!(Mapping capabilities are
added)[https://www.specifysoftware.org/wp-content/uploads/2017/06/paleomap_screenshot_cropped.png]

The Specify Software Project is enthused to announce three new capabilities in
Specify 7.3 (and Specify 6.6.06), which was released 12 October 2017.

**Global Genome Biodiversity Network** — Because biological collections and
biorepositories are more comprehensively managing tissue and extract information
for molecular research, we enhanced Specify to better store, publish, and
integrate tissue and extract data by adding support for the [Global Genome
Biodiversity Network’s (GGBN)](http://www.ggbn.org/)) data schema and exchange standard for ‘Material
Samples’. GGBN is an international project designed to support the discovery of
tissue and DNA extract samples for biological research. Specify 7.3 (and Specify
6.6.06) now accommodate the data fields proscribed in GGBN standard vocabularies
including information regarding quality and quantity of DNA in an extract stored
in a museum collection. We have added new data tables to Specify and
supplemented existing tables with additional GGBN vocabulary fields to
facilitate specimen curation and collection transactions of extract and tissue
samples used for DNA sequencing. In addition, for “next generation” sequencing
Specify has several new linkout fields in appropriate tables and forms that
point to resolvable NIH SRA ID numbers for web linking museum specimens (in this
case tissues and extracts) to NIH SRA database records. Specify 7 uses the same
database schema as Specify 6, for the most important data field additions
affecting both platforms see “Database Schema Changes” in the Specify 6.6
Release Notes. [This diagram shows the changes we made to Specify’s database
table relationships for molecular sample data.](https://www.specifysoftware.org/wp-content/uploads/2017/11/Specify-Schema-Update-v2.4-Context.pdf)

**Collection Data Exchange Standards and Publishing** — Due to the increasing number
of extensions to the Darwin Core specimen data exchange standard, of which the
GGBN extension is one of the most recent, with Specify 7.3 we enhanced the
platform’s data publishing capabilities to allow for collections data export to
any standards-based schema or extension. Specify 7’s export support includes a
field mapper to link Specify’s database structure and your particular use of
Specify’s database fields to the fields required by the community standard (e.g.
Darwin Core or Audubon Core) for data publishing. This generic, external schema
mapping capability in Specify 7 provides the ultimate in flexibility and
extension in that it enables Specify collections to integrate their data with
any community aggregator or collaborative project database that requires data in
Darwin Core or other standard format. These versatile new capabilities and the
GGBN schema extensions described above were developed in collaboration with the
Global Genome Biodiversity Network. We are grateful for their financial support
underwriting the development of these integration capabilities.

**Paleo Context Plugin** — A third new feature in Specify 7.3 is a geospatial
visualization tool specifically for paleontological collections developed by
Tomislav Urban of the Texas Advanced Computing Center (TACC) in collaboration
with the Nonvertebrate Paleontology Laboratory at the University of Texas at
Austin (UT). The Paleomap plug-in in Specify operates with web mapping services
at UT that use modern day latitude/longitude values to place paleontological
specimens into the geographic context of the time period of deposition. As
pictured in the screenshot above, the app shows the point of collection on the
earth’s surface displaying semi-transparent, modern continental boundaries
overlaid on top of land masses as they were situated at the time of deposition.
Tomislav and Ann Molineux, Director of Museum Operations at the University of
Texas at Austin, envision that by putting the placement of a fossil into
paleogeographic context, Paleomap will enable paleontological researchers to
better understand the spatial biogeography of deep time. The Paleomap plug-in is
already enabled in forms for paleontological collections new to Specify with
this release; existing paleo collections upgraded to Specify 6.6.06 or 7.3 can
easily modify their existing data forms to bring Paleomap into the Specify
interface. We are grateful to TACC and to the UT Museums for their development
of Paleomap for Specify.

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
