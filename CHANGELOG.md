
# Changelog

  

All notable changes to this project will be documented in this file.

  

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

  

## Unreleased

  

Coming in the next few months:

  

- [Duplicate record merging tool](https://discourse.specifysoftware.org/t/record-merging-in-specify-7/939/9)

- [User Interface for editing Data Object Formatters, Forms, and other XML resources](https://github.com/specify/specify7/pull/2796)

- [And a lot more features](https://github.com/specify/specify7/pulls)

## [7.8.10](https://github.com/specify/specify7/compare/v7.8.9...HEAD) (Unreleased)

- [Statistics page](https://discourse.specifysoftware.org/t/statistics-panel-for-specify-7/828)

## [7.8.9](https://github.com/specify/specify7/compare/v7.8.8...v7.8.9) (4 April 2023)

### Added

- Drag and dropping items in a query has been added again (after being removed in 7.7) ([#1282](https://github.com/specify/specify7/issues/1282))
- A bulk preparation count can now be specified when creating a new interaction record ([#2549](https://github.com/specify/specify7/issues/2549))
- You can now link to a specific table in the data model or user preferences category ([#2898](https://github.com/specify/specify7/issues/2898))

### Fixed

- Scroll bars now appear in all dialogs ([#3228](https://github.com/specify/specify7/issues/3228) - *Reported by several institutions*)
- An issue preventing some users from creating a record set from scratch has been resolved ([#3124](https://github.com/specify/specify7/issues/3124) – *Reported by The Ohio State University*)
- An issue preventing some user forms not displaying has been resolved ([#3165](https://github.com/specify/specify7/pull/3165))
- The paginator is now right-aligned ([#3101](https://github.com/specify/specify7/issues/3101))
- Blank fields in a table format are now trimmed instead of using a space character ([#2333](https://github.com/specify/specify7/issues/2333))
- When querying on a record set, the context is now preserved when the query is saved ([#2977](https://github.com/specify/specify7/issues/2977))
- When a query is deleted, the user is now sent back to the home page ([#2580](https://github.com/specify/specify7/issues/2580))
- When a record set is deleted, links to an item in a record set now redirect to the original record ([#2558](https://github.com/specify/specify7/issues/2558))
- Taxon tiles now resize when the browser window is resized ([#2235](https://github.com/specify/specify7/issues/2235))
- Contrast issues for items in the WorkBench have been resolved ([#3212](https://github.com/specify/specify7/issues/3212)) 
- Contrast and styling has been improved for checkboxes and radio buttons ([#1658](https://github.com/specify/specify7/issues/1658))
- A redundant scroll bar in the schema config has been removed ([#3167](https://github.com/specify/specify7/issues/3167))


### Changed

- When creating a new record set, only the Name field is now visible ([#2782](https://github.com/specify/specify7/issues/2782))
- More collections are now visible when selecting a collection upon login ([#2588](https://github.com/specify/specify7/issues/2588) – *Requested by the University of Michigan*)

## [7.8.8](https://github.com/specify/specify7/compare/v7.8.7.1...v7.8.8) (20 March 2023)

### Added

- A new warning for attachments that are too large to upload has been
  added ([#729](https://github.com/specify/specify7/issues/729))
- A webpack visualizer has been added for development purposes ([#3119](https://github.com/specify/specify7/pull/3119))

### Fixed

- "Export to KML" functionality has been returned ([#3088](https://github.com/specify/specify7/issues/3088) - *Reported
  by CSIRO*)
- Fixed issue that prevented some users from merging items in the
  trees ([#3133](https://github.com/specify/specify7/pull/3133) - *Reported by RBGE and AAFC*)
- Display issues preventing the "Name" field from displaying in the Security & Accounts panel has been resolved
  - ([#3140](https://github.com/specify/specify7/issues/3140) - *Reported by SAIAB*)
- Record sets can no longer have a negative index value ([#3033](https://github.com/specify/specify7/issues/3033))
- The color picker is now correctly positioned in Safari ([#2215](https://github.com/specify/specify7/issues/2215))
- The default export delimiter is once again "Comma" instead of "
  Tab" ([#3106](https://github.com/specify/specify7/issues/3106) - *Reported by FWRI*)
- Fixed some app resources not displaying due to a scoping bug ([#3014](https://github.com/specify/specify7/issues/3104)
  - *Reported by SAIAB*)
- System information is now stored in the stack
  trace ([5be8ece](https://github.com/specify/specify7/commit/5be8ece6cd5937354622b9efae162a9cd7aeb329))
- Header overflowing has been resolved in the App Resources
  viewer ([#3103](https://github.com/specify/specify7/issues/3103))


## [7.8.7.1](https://github.com/specify/specify7/compare/v7.8.7...v7.8.7.1) (3 March 2023)

### Fixed

- Resolved an issue with plugins being rendered as read-only ([#3076](https://github.com/specify/specify7/issues/3076))
- "Year" in the date picker now requires the correct format ([#3075](https://github.com/specify/specify7/issues/3075))

## [7.8.7](https://github.com/specify/specify7/compare/v7.8.6...v7.8.7) (1 March 2023)

### Added

- Attachments now have a dynamic preview when viewed that includes the ability
  to download, open in a new tab, or view the record the attachment is
  associated with. This new implementation now uses the form associated with the
  attachment
  table to allow setting defaults in the form definition (useful for `isPublic`
  or `License`
  information) ([#2787](https://github.com/specify/specify7/issues/2787)) –
  *Requested by Gothenburg and others*
- Date fields can now be directly pasted into and relative date input is now
  accepted ([#2845](https://github.com/specify/specify7/issues/2845))
  - Relative dates can be entered by double clicking on a date field and then typing
    `today - 5 days` or a similar input with plus or minus the count of days,
    weeks, months, or years
- External image URLs can now be used for buttons or separator icons on the
  forms ([#3032](https://github.com/specify/specify7/issues/2095))
- The query export delimiter can now be
  configured ([#2849](https://github.com/specify/specify7/issues/2849)) –
  *Requested By Natural History Museums of Denmark*
- Time remaining for WorkBench validation and uploading is now
  shown ([#3058](https://github.com/specify/specify7/pull/3058)) - *Requested by
  CSIRO*
- Added a `CITATION.tff` file to allow users and researchers to cite Specify
  when publishing or referencing the
  software ([#3067](https://github.com/specify/specify7/pull/3067))
- The Specify data model can now be downloaded as
  XML ([#2594](https://github.com/specify/specify7/issues/2594))
- The Specify data model can now be
  printed ([#2988](https://github.com/specify/specify7/issues/2988))


### Changed

- Dialogs now remember their position when resized
  ([#2691](https://github.com/specify/specify7/commit/1b5e1863c397387bf9ecb83cd660de0f48ee6ecb))
- Strict mode for regular expressions is no longer enforced for user-submitted
  regex ([#3042](https://github.com/specify/specify7/pull/3042)) - *Reported by
  CSIRO*
- The max year accepted in any date field is now limited to
  9999 ([#3036](https://github.com/specify/specify7/pull/3036)) – *Reported by
  Agriculture and Agri-Food Canada*
- Non-docker installation instructions have been
  improved ([#3043](https://github.com/specify/specify7/pull/3043)) – *Requested
  by University of Florida*
- A WorkBench row with all matched records will no longer be highlighted as a
  new record ([#2966](https://github.com/specify/specify7/issues/2966))

### Fixed

- Fixed the inability to create new agents from the query combobox in the
  Security & Accounts
  panel ([#2696](https://github.com/specify/specify7/issues/2696)) – *Reported
  By SAIAB, Natural History Museums of Denmark, and others*
- Collectors are now sorted by `orderNumber` instead of `CollectorID`, matching
  the Specify 6
  behavior ([#2981](https://github.com/specify/specify7/issues/2981)) –
  *Reported by Agriculture and Agri-Food Canada*
- Paleo Context and other -to-one resources are now correctly stored upon
  save ([#2785](https://github.com/specify/specify7/issues/2785)) - *Reported by
  KU, The Ohio State University, and others*
- Resolved unexpected behavior regarding tooltips introduced in the previous
  release. Tooltips now trigger and dismiss as
  expected ([#3060](https://github.com/specify/specify7/pull/3060))
- Query combo boxes are now enabled for all tables even when type search is not
  defined ([#3047](https://github.com/specify/specify7/issues/3047))
- Queries exported from one user and imported on another user's account no
  longer duplicates the import on both
  accounts ([#3020](https://github.com/specify/specify7/issues/3020))

## [7.8.6](https://github.com/specify/specify7/compare/v7.8.5...v7.8.6) (22 February 2023)

### Changed

- Top menu has been redesigned. It looks better, takes less space and offers
  more customization options - you can change menu position, or order of menu
  items. [More details](https://discourse.specifysoftware.org/t/seeking-feedback-new-vertical-navigation-menu/970) ([#2820](https://github.com/specify/specify7/issues/2820))
- Instead of using default browser tooltips, Specify now displays modern
  tooltips - they are easier to read thanks to larger font-size and are easier
  to trigger. Plus, they even work on touch screen devices and you can
  copy/paste text from
  them. ([#3002](https://github.com/specify/specify7/pull/3002))
- Updated back-end
  dependencies ([#1915](https://github.com/specify/specify7/pull/1915))
- Make form parsing much more forgiving to
  mistakes ([#2666](https://github.com/specify/specify7/issues/2666), [#2716](https://github.com/specify/specify7/pull/2716))
- The deletion dialog now shows a name of the resource you are about to delete
  for extra
  confirmation ([#2854](https://github.com/specify/specify7/issues/2854)) -
  _Requested by The University of Michigan_
- Improved French localization - thanks to @heathercole
- Improved Ukrainian localization - thanks to @Kefir2105
- Jump to tree node's parent after
  deletion ([#2781](https://github.com/specify/specify7/issues/2781)) - _Requested by AAFC_
- Don't allow adding duplicate Collection
  Relationships ([#2987](https://github.com/specify/specify7/issues/2987)) -
  _Requested by CSIRO_

### Added

- Add indicator in page title if there are unsaved
  changes ([#1685](https://github.com/specify/specify7/issues/1685))
- Reports dialog now shows an icon for base table report belongs
  to ([#1109](https://github.com/specify/specify7/issues/1109)) - _Requested by University of Michigan_
- Add support for restricting min length and max length of a text field on a
  form ([#2022](https://github.com/specify/specify7/issues/2022))
- Show the ID field name and table scope in schema
  viewer ([#2080](https://github.com/specify/specify7/issues/2080))
- Add easy way to show only dependent/independent relationships in schema
  viewer ([#2855](https://github.com/specify/specify7/issues/2855))
- Add an indicator if user lost internet connectivity to prevent data
  loss ([#2711](https://github.com/specify/specify7/issues/2711))
- Warn when importing a query that has hidden
  fields ([#1318](https://github.com/specify/specify7/issues/1318))
- Warn when opening a query that has fields without read
  access ([#1661](https://github.com/specify/specify7/issues/1661))

### Fixed

- Fixed inability to print pages that have scroll
  bars ([#2820](https://github.com/specify/specify7/issues/2820))
- Fix formatted dates in XLSX data sets not always being imported
  correctly ([#2027](https://github.com/specify/specify7/issues/2027)) - _Reported by CSIRO and others_
- Maintain cell height for large text fields in grid
  view ([#2765](https://github.com/specify/specify7/pull/2765)) - Fixed by
  @cdamyx
- Fixed contrast issues with buttons in Query
  Builder ([#2611](https://github.com/specify/specify7/issues/2611)) - Fixed by
  @cdamyx

### Security

- Make opening links in new tab
  safer ([#2600](https://github.com/specify/specify7/issues/2600))

## [7.8.5](https://github.com/specify/specify7/compare/v7.8.4...v7.8.5) (31 January 2022)

### Added

- Taxon Author can now be displayed in the tree
  viewer ([#1121](https://github.com/specify/specify7/issues/1121)) - _Requested
  by Geneva, New Mexico, Unitec, Agriculture and Agri-Food Canada, CSIRO, RBGE
  and many others_
- After a WorkBench upload, creation of a Record Set is now
  optional ([#1848](https://github.com/specify/specify7/issues/1848)) -
  _Requested by Auburn_
- Spanish localization has been improved - thanks
  to [@gallegonovato](https://github.com/gallegonovato) ([commits](https://github.com/specify/specify7/commits?author=gallegonovato)).
  If you would like to contribute too,
  please [see the instructions](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956)
- To be more security conscious, Specify 7 source code is now regularly scanned
  by GitHub's CodeQL tool, which is designed to find security
  vulnerabilities ([commit](https://github.com/specify/specify7/commit/9465b9e0972fcc7b03cfa1aadf50cc1a20749ee9))
- Added a "Collapse All" button to tree
  viewer ([#2050](https://github.com/specify/specify7/issues/2050)) - _Requested
  by CSIRO_

### Changed

- Data Model viewer has been redesigned to work better with printing the page
  and to support `Ctrl+F` across fields in different
  tables, along with other usability
  improvements ([#2855](https://github.com/specify/specify7/issues/2855))
- Low resolution PNG table icons have been replaced with modern SVG icons. For
  most tables the new icons look similar. Attachments icons have been modified
  to make text more
  readable. ([#2368](https://github.com/specify/specify7/issues/2368))
- Large text fields in grid view now maintain consistent
  height ([#2765](https://github.com/specify/specify7/issues/2765)) - Fixed by
  @cdamyx

### Fixed

- Permissions for dependent resources now cascade like
  expected ([#2007](https://github.com/specify/specify7/issues/2007))
- Lines in remote prefs that follow a commented out line were not parsed
  correctly. This is now
  fixed ([commit](https://github.com/specify/specify7/commit/91b80b709fe4bd8a546a7c4d756df91de17fff88))
- Fixed values that start with a number (`5A`) being incorrectly coerced into a
  number (`5`) (for visual purposes
  only) ([#2805](https://github.com/specify/specify7/issues/2805)) - _Reported
  by RBGE_
- Fixed the `(formatted)` column in query results not having a table
  icon ([#2536](https://github.com/specify/specify7/issues/2536))
- All references to table names anywhere in the interface are now using the
  table name you chose in the schema
  configuration ([#2420](https://github.com/specify/specify7/issues/2420)
  and [commit](https://github.com/specify/specify7/commit/a579909285a7c5b35dc1d32cd99f4919f654a688)) -
  _Reported by RGBE_

## [7.8.4](https://github.com/specify/specify7/compare/v7.8.3...v7.8.4) (18 January 2023)

### Added

- A new preference has been added allowing users to add children to synonymized
  parents as well as synonymizing nodes
  with children ([#751](https://github.com/specify/specify7/issues/751)
  – [Instructions](https://discourse.specifysoftware.org/t/enable-creating-children-for-synonymized-nodes/987/4) –
  _Requested by FWRI, CSIRO, AAFC, RBGE, Ville de Genève, and more_)
- Added a Specify crash report visualizer. The tool is mostly for
  internal use, but can be helpful for system administrators. See
  [#2829](https://github.com/specify/specify7/pull/2829) for more
  information

### Changed

- `500 error occurred` messages have been replaced by useful error
  dialogs ([#108](https://github.com/specify/specify7/issues/108), [#2668](https://github.com/specify/specify7/issues/2668)
  – _Requested by many institutions_)
    - Error responses from the backend have been improved dramatically for
      environments not using debug mode. Errors
      from MySQL, Django, and other back-end components will now be displayed
      outside of debug mode showing the
      ExceptionType, message, and StackTrace in a format that can assist on-site
      IT and collection administrators in
      discovering and solving configuration problems.
- Introduced a new Specify favicon and icons for a variety of
  devices ([#2752](https://github.com/specify/specify7/pull/2752))
- Small beauty improvements have been made, adding shadows and lighter borders
  to fields throughout
  Specify ([#2773](https://github.com/specify/specify7/pull/2773))
- The Delete button has been moved to the Data Set Metadata menu in the
  WorkBench ([#2755](https://github.com/specify/specify7/pull/2755))
- Languages that have incomplete localization can be selected after a warning
  for use in
  Specify ([#2790](https://github.com/specify/specify7/pull/2790))
- When no attachment server is present, you can no longer attempt to upload
  files ([#2585](https://github.com/specify/specify7/issues/2585) - _Reported by
  The University of Michigan_)
- Interactions table names are now
  dynamic ([#2420](https://github.com/specify/specify7/issues/2420) – _Requested
  by
  RBGE_)
- Specify now ignores synonymized nodes when checking the tree
  structure ([#2707](https://github.com/specify/specify7/issues/2707) – Reported
  by The University of Michigan)

### Fixed

- Queries exported to CSV now use the field label as a heading rather than the
  field's string
  ID ([#1575](https://github.com/specify/specify7/issues/1575) – _Reported by
  FWRI, CSIRO, RBGE, and many more_)
- Exporting a query on a record set now is scoped to the record set query
  results ([#2761](https://github.com/specify/specify7/issues/2761) – _Reported
  by CSIRO_)
- The print icon now matches other button's appearance in the GeoMap
  viewer ([#2764](https://github.com/specify/specify7/pull/2764))
- Available collections are now only fetched once rather than
  twice ([#2770](https://github.com/specify/specify7/pull/2770))
- Separator icons now display correctly on the
  forms ([#2074](https://github.com/specify/specify7/issues/2074))
- Exporting the data model to TSV now is exported
  properly ([#2815](https://github.com/specify/specify7/issues/2815))

## [7.8.3](https://github.com/specify/specify7/compare/v7.8.2...v7.8.3) (9 January 2023)

This update includes many bug fixes in addition to laying the groundwork for
Specify's UI to support Spanish, French,
Ukranian, and many more languages. If you are interested in helping support our
localization effort, please see our
guide
on *
*[Getting Started with Specify 7 Localization](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956)
**
and contact us
at [support@specifysoftware.org](mailto:support@specifysoftware.org) if you have
any questions or would
like to help translate to a language we do not yet support.

### Changed

- Global Prefs and Remote User Prefs are now differentiated in the App Resources
  viewer ([#2430](https://github.com/specify/specify7/issues/2430))
- Usernames are no longer automatically capitalized in the navigation menu
- Language codes now appear next to the language
  name ([#1903](https://github.com/specify/specify7/issues/1903))
- Empty record sets now inform the user that it cannot be opened in read-only
  mode ([#2698](https://github.com/specify/specify7/issues/2698))

### Fixed

- Exchange In, Exchange Out, and Disposal attachments now function
  properly ([#2525](https://github.com/specify/specify7/issues/2525) -
  _Requested by RBGE_)
- GeoMap full screen icon now conforms to rounded corner
  preference ([#2506](https://github.com/specify/specify7/issues/2506))
- Fixed app resource creation being blocked because of it trying to get an
  invalid field

### Updated

- Updated the copyright year to 2023

## [7.8.2](https://github.com/specify/specify7/compare/v7.8.1...v7.8.2) (29 December 2022)

Specify 7 is now integrated with
[Weblate](https://hosted.weblate.org/projects/specify-7/) - a continuous
localization service. This paves the way for supporting dozens of languages in
Specify 7. We will be adding Spanish and French localization in near future.

Additionally, specify now includes the ability to store different
collections' assets in separate folders.
([#1056](https://github.com/specify/specify7/issues/1056#issuecomment-1368093439) -
_Requested By
NHMD_)

[More information](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956)

## [7.8.1](https://github.com/specify/specify7/compare/v7.8.0...v7.8.1) (13 December 2022)

### Changed

- Attachments now uses a photo icon instead of a
  link ([#2530](https://github.com/specify/specify7/issues/2530))
- Animated shadows are now used when viewing attachments

### Fixed

- The log in button now operates correctly when accessing the database via an
  anonymous user ([#2651](https://github.com/specify/specify7/issues/2651))

## [7.8.0](https://github.com/specify/specify7/compare/v7.7.5...v7.8.0) (13 December 2022)

This update introduces a new Form “Meta Menu”, reimplements the App Resource
Editor, introduces spatial search in the Query Builder, adds numerous usability
improvements and fixes many bugs.

[Full Release Notes](https://discourse.specifysoftware.org/t/specify-7-8-release-notes/)

[Full List of Improvements](https://github.com/specify/specify7/milestone/27?closed=1)

[List of internal bug fixes](https://github.com/specify/specify7/milestone/28)

## [7.7.5](https://github.com/specify/specify7/compare/v7.7.4.1...v7.7.5) (17 October 2022)

### Fixed

- Fix query result table formatting to use correct
  formatter ([#2271](https://github.com/specify/specify7/pull/2271))
- Fix DatePicker not allowing to change
  precision ([#2323](https://github.com/specify/specify7/pull/2323))

## [7.7.4.1](https://github.com/specify/specify7/compare/v7.7.4...v7.7.4.1) (12 October 2022)

### Fixed

- Fix an infinite fetch loop in
  FormTable ([#2309](https://github.com/specify/specify7/issues/2309))

## [7.7.4](https://github.com/specify/specify7/compare/v7.7.3...v7.7.4) (12 October 2022)

### Added

- Collection Relationships can now be uploaded though WorkBench
  Plugin ([#2043](https://github.com/specify/specify7/pull/2043)) - _Requested
  by CSIRO_
- Allow customizing the delimiter when entering the list of catalog
  numbers when creating a new interaction
  ([#2190](https://github.com/specify/specify7/issues/2190)) - _Requested by
  CSIRO_

### Changed

- Having invalid query search parameters no longer prevents from running
  the query ([#2185](https://github.com/specify/specify7/issues/2185)) - _
  Requested by CSIRO_
- Pick List size limit is no longer enforced
  ([#1025](https://github.com/specify/specify7/issues/1025)) -
  _Requested by RGBE and others_

### Fixed

- Fix for query builder not allowing "in" filter on numeric fields
  ([#2115](https://github.com/specify/specify7/issues/2115))
- Using invalid field names in checkboxes no longer breaks the form
  ([#2194](https://github.com/specify/specify7/issues/2194))
- Fix Query Combo Box displaying "Add" for users that don't have
  permission to create related record
  ([#2216](https://github.com/specify/specify7/issues/2216))
- Fix error when adding Address of Record SubView to Borrow form
  ([#2006](https://github.com/specify/specify7/pull/2006)) -
  _Reported by CSIRO_
- Fixed autocomplete bugs on backspace key press
  ([#2203](https://github.com/specify/specify7/issues/2203)) - _Reported
  by Natural Science Collections Facility_
- Fix permission checking for ephemeral queries with collection override
  ([#2208](https://github.com/specify/specify7/issues/2208))
- Fix Specify incorrectly checking for `Permissions -> List Admins -> read`
  permission ([#2019](https://github.com/specify/specify7/issues/2019))
- Fix PickLists to relationship fields not being displayed correctly
  ([#2230](https://github.com/specify/specify7/issues/2230)) - _Reported by
  Emory Herbarium_
- Fix Specify using wrong pick list when there are multiple pick lists
  with the same name ([#2285](https://github.com/specify/specify7/issues/2285))
    - _Reported by Emory Herbarium, KU Fish and others_
- Fix for query results fetcher not detecting scroll
  bar ([#2301](https://github.com/specify/specify7/issues/2301))

## [7.7.3](https://github.com/specify/specify7/compare/v7.7.2...v7.7.3) (26 September 2022)

### Added

- You can now upload `GUIDs` for tree tables though the
  WorkBench ([#2097](https://github.com/specify/specify7/issues/2097))
- Support customizing Collection Object formatter in Collection Relationship
  Plugin ([#2157](https://github.com/specify/specify7/pull/2157)) - _Requested
  by CSIRO and others_

### Fixed

- Fix "Create Invite Link" having incorrect
  condition ([#2140](https://github.com/specify/specify7/pull/2140)) - _
  Discovered by RGBE_
- Fix list of tables pick list not working on form
  load ([#2146](https://github.com/specify/specify7/issues/2146))
- Fix an error when creating Funding Agent records
  ([#715](https://github.com/specify/specify7/issues/715)) - _Reported
  by CSIRO_
- Fix for focus loss when using Query Combo Box without a mouse
  ([#2142](https://github.com/specify/specify7/issues/2142)) - _Reported
  by RGBE_

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
  WorkBench ([#2077](https://github.com/specify/specify7/issues/2077)) - _
  Reported by CSIRO_
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
  Preferences ([#159](https://github.com/specify/specify7/issues/159)) - _
  Reported by CSIRO_
- Display Git Hash in the Specify "About"
  dialog ([#1980](https://github.com/specify/specify7/issues/1980)) - _Reported
  by RBGE_
- Make autocomplete search algorithm
  configurable ([#1921](https://github.com/specify/specify7/issues/1921)
  , [#1935](https://github.com/specify/specify7/issues/1935)) - _Reported by
  RBGE_
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

  Specify 6 does not yet support MySQL
    8. ([#476](https://github.com/specify/specify7/issues/476))

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
Biodiversity Network’s (GGBN)](http://www.ggbn.org/)) data schema and exchange
standard for ‘Material
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

**Collection Data Exchange Standards and Publishing** — Due to the increasing
number
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

## [7.0.1](https://github.com/specify/specify7/compare/v7.0.0...v7.0.1) (20 April 2015)

[Bug fixes and new features](https://github.com/specify/specify7/compare/v7.0.0...v7.0.1)

## [7.0.0](https://github.com/specify/specify7/commits/v7.0.0) (22 December 2014)

[Bug fixes and new features](https://github.com/specify/specify7/commits/v7.0.0)

