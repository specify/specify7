
# Changelog

  

All notable changes to this project will be documented in this file.

  

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [7.9.7](https://github.com/specify/specify7/compare/v7.9.6.2...v7.9.7) (1 October 2024)

### Added
* Added an all-new **Bulk Carry Forward** feature to enable series data entry in Specify 7 ([#4804](https://github.com/specify/specify7/pull/4804), [#5120](https://github.com/specify/specify7/pull/5120) – _Requested by University of Minnesota Entomology, Bulgarian Academy of Sciences, KU Entomology, and many others_)
* Added support for Geography Code at any rank when building a query ([#5094](https://github.com/specify/specify7/pull/5094) – _Requested by Museu de Ciències Naturals de Barcelona, KU Ichthyology, and many others_)
* Added a preference (enabled by default) to insert a [UTF-8 BOM](https://en.wikipedia.org/wiki/Byte_order_mark#:~:text=%5B3%5D-,UTF%2D8,-%5Bedit%5D) to CSV exports ([#5204](https://github.com/specify/specify7/pull/5204))
* When enabled, you should be able to open exported CSV files in Excel without using the import utility.

### Changed
* Removed the limit on the number of results returned when searching a tree in the tree viewer ([#5125](https://github.com/specify/specify7/pull/5125))
* Descriptions for User Preferences have been improved ([#5064](https://github.com/specify/specify7/pull/5064))
* Specify in Docker is now built for both `x64_86` and `arm64` architectures, enabling native deployment on ARM-based servers ([#5235](https://github.com/specify/specify7/pull/5235))
* Collection, Discipline, Division, and the Audit Log are now visible in the list of query tables by default ([#5133](https://github.com/specify/specify7/pull/5133))

### Fixed
* Fixed an issue that caused table aggregation separators to be cleared when set to the default separator (`; `) ([#5240](https://github.com/specify/specify7/pull/5240))
* Fixed an issue that allowed users to carry forward preparations in an interaction when cloning or using carry forward ([#4905](https://github.com/specify/specify7/pull/4905))
* Fixed an issue that would cause a crash if an `ExportFeed` was configured with an invalid Specify user ID ([#5042](https://github.com/specify/specify7/pull/5042))
* Fixed an issue where a border would not appear for query items in the report query dialog ([#5159](https://github.com/specify/specify7/pull/5159))

## [7.9.6.2](https://github.com/specify/specify7/compare/v7.9.6.1...v7.9.6.2) (22 July 2024)

- Fixed an issue that prevented `TimestampModified` from being captured upon saving a record since the `v7.9.6` release ([#5108](https://github.com/specify/specify7/issues/5108) – *Reported by the University of Kansas and Ohio State University*)
- Fixed an issue that caused large trees to perform slowly or crash the browser due to using too much memory ([#5115](https://github.com/specify/specify7/pull/5115) – *Reported by The Hebrew University of Jerusalem and Royal Botanic Gardens Edinburgh*)

## [7.9.6.1](https://github.com/specify/specify7/compare/v7.9.6...v7.9.6.1) (9 July 2024)

- Fixes an issue that led to tree definition item separators being trimmed ([#5076](https://github.com/specify/specify7/pull/5076))
- The form system now includes a `whiteSpaceSensitive` attribute, which allows any field to preserve whitespace upon saving

## [7.9.6](https://github.com/specify/specify7/compare/v7.9.5...v7.9.6) (1 July 2024)


### Added
-  Added a **[tree rank editor](https://discourse.specifysoftware.org/t/editing-tree-definitions-ranks-in-specify-7/1783)** to add, edit, and remove tree ranks ([#4257](https://github.com/specify/specify7/pull/4257) – *Requested by University of Kansas, The University of Michigan, Commonwealth Scientific and Industrial Research Organisation, Natural Resources Canada, College of Idaho, New Mexico State Herbarium, and many others*)
-  **[Extended record merging](https://discourse.specifysoftware.org/t/record-merging/1324#record-merging-1)** to several new tables ([#4606](https://github.com/specify/specify7/pull/4606) – *Requested by Calvert Marine Museum, Commonwealth Scientific and Industrial Research Organisation, Royal Botanic Garden Edinburgh, and many more*)
   - Locality
   - Paleo Context
   - Collecting Event 
- Added a new tool to [**bulk update Locality and Geo Coord Details records**](https://discourse.specifysoftware.org/t/locality-update-tool/1784) that were georeferenced in external applications such as [CoGe](https://coge.geo-locate.org/About.htm) ([#4548](https://github.com/specify/specify7/pull/4548) – *Requested by Specify users in the DigIn TCN, formalized by Dean Pentcheff and Nelson Rios*)
- Added a new tool to **[bulk move preparations](https://discourse.specifysoftware.org/t/trees-in-specify-7/534/7?u=specify)** from one storage location to another ([#4682](https://github.com/specify/specify7/pull/4682) – *Requested by University of Kansas*)
-  Added **[Deaccessions](https://discourse.specifysoftware.org/t/interactions-in-specify/961#deaccessions-16)** to the Interactions list ([#4806](https://github.com/specify/specify7/pull/4806))
-  The name of the accepted node will now show when hovering over a synonymized node ([#4704](https://github.com/specify/specify7/pull/4704) – *Requested by University of Kansas*)
-  Table aggregations can now be chosen explicitly in the Query Builder ([#4646](https://github.com/specify/specify7/pull/4646))
-  Calculated fields for the total number of preparations and total items in Exchange Outs, Disposals, Gifts, and Deaccessions have been added ([#4824](https://github.com/specify/specify7/pull/4824) – *Requested by Royal Botanic Garden Edinburgh, Pioneer Trails Regional Museum, The University of Michigan, and Museu de Ciències Naturals de Barcelona*)
-  Added support for the 'Group Number' field in Taxon queries ([#4724](https://github.com/specify/specify7/pull/4724) – *Requested by the Florida Museum of Natural History and others*)
-  Added validation to the Locality form to prevent users from saving invalid latitude and longitude values ([#4939](https://github.com/specify/specify7/pull/4939))

### Changed
-  'Timestamp Modified' and 'Timestamp Created' field values can now be overridden when uploading data in the WorkBench ([#4618](https://github.com/specify/specify7/pull/4618) – *Requested by New Mexico State Herbarium*)
-  Users can no longer save a Collection Object with a determination without a *current* determination ([#4901](https://github.com/specify/specify7/pull/4901))
-  GeoMap in the WorkBench now displays only the selected rows when a row is selected, or all rows when no row is selected ([#4943](https://github.com/specify/specify7/pull/4943))
-  Changed 'Transactions' dialog header to 'Interactions' and refactored dialog with new icons ([#4474](https://github.com/specify/specify7/pull/4474))
-  The separator used in query results is now a hyphen (-) character instead of a dot (·) character. This change prevents encoding issues when opening query results directly in Excel ([#4678](https://github.com/specify/specify7/pull/4678) – *Requested by South African Institute for Aquatic Biodiversity*)
-  When granting the Specify 6 "Admin" permission, access to all collections will now be granted by default  ([#4652](https://github.com/specify/specify7/pull/4652))
-  Changed unavailable preparations wording to be more clear ([#4890](https://github.com/specify/specify7/pull/4890))
-  Added a view button by default to `parent` query combo boxes ([#4903](https://github.com/specify/specify7/pull/4903))
-  Removed the "Clone" option from certain app resources that are identified by name alone ([#4902](https://github.com/specify/specify7/pull/4902))
-  A warning will now appear when deleting a category on the Statistics page ([#3732](https://github.com/specify/specify7/pull/3732))
-  The 'Without Preparations' and 'Add Unassociated Item' buttons have been moved to the left of the "Add Items" dialog  ([#4577](https://github.com/specify/specify7/pull/4577))


### Fixed
-  Exchange Out 'Add Items' dialog is now triggered when adding Exchange Out Preps from the form ([#4805](https://github.com/specify/specify7/pull/4805))
-  Fixed an issue where some subviews would not expand when new records are added ([#4899](https://github.com/specify/specify7/pull/4899))
-  Fixed an issue that prevented some agent merges from completing successfully ([#4699](https://github.com/specify/specify7/pull/4699))
-  Fixed an issue preventing suggested mappings from being selected in the WorkBench ([#4926](https://github.com/specify/specify7/pull/4926))
-  Disabled the 'Save' and 'Delete' buttons when editing forms, table formats, and table aggregation ([#4891](https://github.com/specify/specify7/pull/4891))
-  Fixed an issue that would show an error when attempting to add children to a synonymized node ([#4874](https://github.com/specify/specify7/pull/4874))
-  Fixed the `condition="always"` attribute being unrecognized when defining conditional forms ([#4879](https://github.com/specify/specify7/pull/4879))
-  When updating the RSS feed, notifications will now be sent to the user specified in the `ExportFeed` app resource in addition to the current user ([#4956](https://github.com/specify/specify7/pull/4956))
- The new record set and gallery icons now only appear within a record set containing records from the same table ([#4904](https://github.com/specify/specify7/pull/4904))

## [7.9.5](https://github.com/specify/specify7/compare/v7.9.4...v7.9.5) (20 May 2024)

This release has for objective to migrated Workbench to React to align it with the rest of the application to ensure consistency and modernising the codebase.
Workbench functionalities remain unchanged but this release helps improve internal development and maintenance of the workbench going forward. 
[Workbench Conversion](https://github.com/specify/specify7/pull/4637)

### Added

- **Live Search feature in Workbench**

## [7.9.4](https://github.com/specify/specify7/compare/v7.9.3.1...v7.9.4) (13 May 2024)

### Added

- **Added a visual editor for some app resources**  ([#2796](https://github.com/specify/specify7/pull/2796))
   - The initial release supports
      - [Form Definitions](https://discourse.specifysoftware.org/t/editing-forms-in-specify-7/1557)
      - [Table Formats](https://discourse.specifysoftware.org/t/editing-table-formats-and-aggregations-in-specify-7/1558)
      - [Table Aggregation](https://discourse.specifysoftware.org/t/editing-table-formats-and-aggregations-in-specify-7/1558)
   - Visual editors for additional app resources will be added in the future.
   - Enforce uniqueness requirements for name ([#4164](https://github.com/specify/specify7/pull/4164))
   - Added query combo box for Specify Users in Export Feed ([#4345](https://github.com/specify/specify7/pull/4345))
   - Added support for [conditional forms](https://discourse.specifysoftware.org/t/editing-forms-in-specify-7/1557#conditional-rendering-22)
   - Added a preview for web links, table formats, and table aggregations ([#4343](https://github.com/specify/specify7/pull/4343))
- Added numerous improvements to distinct queries ([#4596](https://github.com/specify/specify7/pull/4596) – *Requested by University of Kansas, University of Michigan, Commonwealth Scientific and Industrial Research Organisation*)
   - Added links to records in distinct queries where all columns returned are the same
   -  Introduced the option to view groups of grouped records in distinct query results 
   -  Distinct queries can now be exported to CSV
- Added the ability to display only nodes with associated records in the tree viewer ([#4023](https://github.com/specify/specify7/pull/4023) – Commonwealth Scientific and Industrial Research Organisation)
- Added the ability to set default values for boolean/checkbox fields in the form definition (#4585 – *Requested by University of Michigan, Commonwealth Scientific and Industrial Research Organisation*
- Added the ability to import and export WorkBench data set upload plans ([#1363](https://github.com/specify/specify7/issues/1363) – *Requested by Commonwealth Scientific and Industrial Research Organisation and others*)
- Subforms can now be collapsed ([#3642](https://github.com/specify/specify7/pull/3642) – *Requested by Commonwealth Scientific and Industrial Research Organisation and Agriculture and Agri-Food Canada*)
- Added a new form element to show a view button next to a query combo box ([#4199](https://github.com/specify/specify7/pull/4199) – *Requested by South African Institute for Aquatic Biodiversity*)
- Fields in the Schema Config can now be sorted by their visibility status ([#3516](https://github.com/specify/specify7/pull/3516))
- Added the ability to switch to 'Basic View' and 'Hide Field Mapper' in embedded query dialogs ([#2863](https://github.com/specify/specify7/pull/2863))
- Added pagination when viewing large lists of resources (record sets, queries, etc.) to improve performance ([#3195](https://github.com/specify/specify7/pull/3195))
- Added a preference to have records in read-only mode by default requiring the user to press an edit button before changes can be made ([#3553](https://github.com/specify/specify7/pull/3553))
- Added the ability to hide the plus button in forms ([#3669](https://github.com/specify/specify7/pull/3669) – *Requested by Commonwealth Scientific and Industrial Research Organisation*)
- Added bulk resolve and bulk return when returning loans ([#4224](https://github.com/specify/specify7/pull/4224) – *Requested by Commonwealth Scientific and Industrial Research Organisation*)
- Kept the search panel open when modifying XML form ([#4260](https://github.com/specify/specify7/pull/4260))
- A warning is now displayed if there are no available preparations associated with a catalog number when making an interaction ([#4195](https://github.com/specify/specify7/pull/4195))
- Added table icons to the WorkBench data sets dialog based on base table in the upload plan ([#4475](https://github.com/specify/specify7/pull/4475))
- Added frontend business rules for Address `isPrimary` so that it is set by default when adding a new address ([#4443](https://github.com/specify/specify7/pull/4443))


### Changed
- Differentiated list of tables for interactions and data entry ([#4198](https://github.com/specify/specify7/pull/4198))
- Removed table name before app resource titles ([#4132](https://github.com/specify/specify7/pull/4132))
- Numeric inputs no longer change on scroll ([#4249](https://github.com/specify/specify7/pull/4249))
- Disabled gallery icon when there are no attachments on forms ([#4220](https://github.com/specify/specify7/pull/4220))
- Search preview dialogs no longer display subviews ([#4254](https://github.com/specify/specify7/pull/4254))
- Improved logic for selecting main tables fields when creating new records from query combo boxes ([#4293](https://github.com/specify/specify7/pull/4293))
   - Correctly detected main table fields in formatters ([#4516](https://github.com/specify/specify7/pull/4516))
- Sidebar color preference has been moved and renamed ([#4355](https://github.com/specify/specify7/pull/4355))
- Displayed disable icon add button instead of link when lowest tree rank ([#4351](https://github.com/specify/specify7/pull/4351))
- "Use Localized Field Labels" checkbox is now a button ([#4344](https://github.com/specify/specify7/pull/4344))
- Renamed record merging policy to `/record/merge` ([#4329](https://github.com/specify/specify7/pull/4329))
- Switched to muted colors for taxon tiles ([#4476](https://github.com/specify/specify7/pull/4476) – *Requested by Virginia Institute of Marine Science*)
- Miscellaneous Reports dialog improvements ([#4396](https://github.com/specify/specify7/pull/4396))
- Backend query exports now have user-friendly names  ([#3590](https://github.com/specify/specify7/pull/3590))

### Fixed
- Fixed an issue where the WorkBench did not always check for  custom uniqueness rules ([#4593](https://github.com/specify/specify7/pull/4593) – *Reported by Commonwealth Scientific and Industrial Research Organisation*)
- Fixed bug causing incorrect disambiguation behavior in the WorkBench ([#4777](https://github.com/specify/specify7/pull/4777))
- Made behavior consistent for Reports/Labels across forms and reports dialog, enhanced Report preferences. ([#4299](https://github.com/specify/specify7/pull/4299) – *Reported by Florida Fish and Wildlife Research Institute and Commonwealth Scientific and Industrial Research Organisation*)
- Fixed an issue that prevented new reports or labels from being created when there was a formatted table in the query ([#4427](https://github.com/specify/specify7/pull/4427) – *Reported by The Hebrew University of Jerusalem, Florida Fish and Wildlife Research Institute, Gothenburg Museum of Natural History, and Oranim College of Education*)
- Make taxonomic rank properly recompute when the parent changes ([#4462](https://github.com/specify/specify7/pull/4462) – *Reported by Agriculture and Agri-Food Canada*)
- Added a prompt for a user to define a record set name when creating one ([#4346](https://github.com/specify/specify7/pull/4346))
- Improved home page load performance ([#4240](https://github.com/specify/specify7/pull/4240))
- Makes 'Save' button style consistent in Schema Config and Mapper ([#3527](https://github.com/specify/specify7/pull/3527))
- Make preferences visually read-only for users without proper permissions ([#3551](https://github.com/specify/specify7/pull/3551))
- Fixed an issue preventing preparations from being added on the Loan form when displayed it was displayed in "form view" ([#3659](https://github.com/specify/specify7/pull/3659))
- Fixed an issue where a cell or row could be selected multiple times in the WorkBench ([#3675](https://github.com/specify/specify7/pull/3675))
- Fixed an issue where the WorkBench could not import certain spreadsheets ([#4223](https://github.com/specify/specify7/pull/4223) – *Reported by Royal Botanic Garden Edinburgh*)
- Refactored date picker and added tests ([#4276](https://github.com/specify/specify7/pull/4276))
- Fixed spelling mistake in new record set text ([#4317](https://github.com/specify/specify7/pull/4317))
- The cache is cleared when form edits are made, allowing you to see the latest version ([#4290](https://github.com/specify/specify7/pull/4290))
- Fixed issues when parsing remote preferences ([#4251](https://github.com/specify/specify7/pull/4251) – *Reported by Museu de Ciències Naturals de Barcelona*)
- Fix inconsistency with hidden tables in schema and new query lists ([#4357](https://github.com/specify/specify7/pull/4357) – *Reported by Commonwealth Scientific and Industrial Research Organisation*)
- Made `usertype` get ignored when searching for Common directory app resources to ensure global app resources are applied appropriately ([#4332](https://github.com/specify/specify7/pull/4332))
- Made minor accessibility improvements ([#4449](https://github.com/specify/specify7/pull/4449))
- Scoped all front-end requests where needed to prevent resources from returning records from other collections ([#3304](https://github.com/specify/specify7/pull/3304))
- Fixed WorkBench dialog heading so it displays "Timestamp Uploaded" instead of "Timestamp Modified" ([#4472](https://github.com/specify/specify7/pull/4472))

## [7.9.3.1](https://github.com/specify/specify7/compare/v7.9.3...v7.9.3.1) (29 January 2024)

This release fixes an issue that could cause an error when viewing an Accession or Repository Agreement form with interaction agents present.

## [7.9.3](https://github.com/specify/specify7/compare/v7.9.2...v7.9.3) (23 January 2024)

### Added
* **Batch Attachment Upload** ([#3539](https://github.com/specify/specify7/pull/3539)) *– Requested by University of Michigan, Commonwealth Scientific and Industrial Research Organisation, and many others*
   * This tool enables users to import attachments in bulk by matching the filenames of the uploaded attachments with identifiers for existing records!
   * [User Documentation](https://discourse.specifysoftware.org/t/batch-attachment-uploader/1374)

* **Add configurable uniqueness rules** ([#2712](https://github.com/specify/specify7/issues/2712)) – *Requested by Commonwealth Scientific and Industrial Research Organisation, University of Michigan, New Mexico State Herbarium, New Brunswick Museum, Natural History Museum Geneva*
   * The [Schema Config](https://discourse.specifysoftware.org/t/using-the-schema-config-in-specify-7/535) now allows configuration of Uniqueness Rules.
      * Each rule consists of two groups: 'fields' and 'scope'.
      * 'Fields' represent the values that must be unique within a specific scope.
      * For example, in the Collection Object, the `catalogNumber` field has a unique rule within the scope of the `Collection`. This ensures that each collection must have a unique catalog number.
   * [User Documentation](https://discourse.specifysoftware.org/t/wip-configuring-uniqueness-rules/1487)

### Changed
* Buttons on the Statistics Page are now stylistically consistent with other buttons elsewhere in the application ([#4315](https://github.com/specify/specify7/pull/4315))
* When add a child under a node in any tree, the next enforced rank in the tree will pre-populate on the form ([#4273](https://github.com/specify/specify7/pull/4273))

### Fixed
* Fixed an issue in the WorkBench where an error occurred during validation if multiple picklists had the same name ([#4272](https://github.com/specify/specify7/pull/4272)) – *Reported by University of Michigan, Museu de Ciències Naturals de Barcelona, Naturhistorisches Museum Bern, Hebrew University of Jerusalem*
* Files are now only downloaded once instead of twice ([#4404](https://github.com/specify/specify7/pull/4404)) *– Reported by Agriculture and Agri-Food Canada and others*
* Attachments are now only fetched when the attachment gallery icon is clicked ([#4284](https://github.com/specify/specify7/pull/4284))
* Fixed an issue that prevented the page title from being displayed properly ([#4291](https://github.com/specify/specify7/pull/4291)) *– Reported by University of Michigan*
* When 'line wrap' is disabled, the app resource editor now stays confined to the view width ([#4310](https://github.com/specify/specify7/pull/4310))
* Fixed an issue where rank name would not display when tree definition items are missing a title ([#4353](https://github.com/specify/specify7/pull/4353))
* Fixed an issue that may corrupt app resource record data when performing a record merge ([#4237](https://github.com/specify/specify7/pull/4237)) – *Reported by Museu de Ciències Naturals de Barcelona*


## [7.9.2](https://github.com/specify/specify7/compare/v7.9.1...v7.9.2) (18 December 2023)

### Added
* Allow data set validation in the WorkBench without requiring 'create' permission for the base table ([#4090](https://github.com/specify/specify7/pull/4090)) – *Requested by Commonwealth Scientific and Industrial Research Organisation and others*
* Added a new 'Attachment Gallery' button in Record Sets ([#3363](https://github.com/specify/specify7/pull/3363))
* Added new tree statistics that use direct rank names (and intelligently climb the tree) ([#3942](https://github.com/specify/specify7/pull/3942))
* Added `arm64` support for Docker deployments ([#4068](https://github.com/specify/specify7/pull/4068))
* Use `.env` for docker deployment ([#4111](https://github.com/specify/specify7/pull/4111)) – *Requested by Kansas State University, South African Institute for Aquatic Biodiversity, The University of Michigan, and others*
* Optimized Agent merging process when updating records in the Collection Object and Taxon tables ([#4102](https://github.com/specify/specify7/pull/4102))
* Added new icons for miscellaneous dialogs ([#4098](https://github.com/specify/specify7/pull/4098))
* Added a preference to change the color of the navigation menu background in light mode ([#4163](https://github.com/specify/specify7/pull/4163)) – *Requested by Royal Botanic Garden Edinburgh*
* Display checkbox 'show conflicting field' only when necessary ([#3935](https://github.com/specify/specify7/pull/3935))

### Changed
* Improved tree viewer count performance by implementing a recursive CTE approach ([#3613](https://github.com/specify/specify7/pull/3613)) – *Reported by South African Institute for Aquatic Biodiversity, NOU Herbarium, University of Massachusetts, California Academy of Sciences, University of Florida, Royal Botanic Gardens of Edinburgh, South African Institute for Aquatic Biodiversity, and others*
* Updated icon for 'Update RSS Feed' in User Tools ([#4085](https://github.com/specify/specify7/pull/4085))

### Fixed
* Fixed an issue where cloning or carrying forward would duplicate preparations or determinations when creating a new collection object record ([#4160](https://github.com/specify/specify7/pull/4160)) – *Reported by The University of Kansas, Museu de Ciències Naturals de Barcelona, and others*
* Fixed an issue that resulted in crashing when querying 'Created By' or 'Modified By' on an Agent record ([#3752](https://github.com/specify/specify7/pull/3752)) – *Requested by Fish and Wildlife Research Institute and others* 
* Fixed an infinite loop when entering 'Browse in Forms' ([#4074](https://github.com/specify/specify7/pull/4074)) – *Reported by The University of Kansas*
* Fixed an issue where URL routing with `bycatalog` did not switch collections ([#3452](https://github.com/specify/specify7/pull/3452))
* In basic view, queries now scroll to the added query line ([#4057](https://github.com/specify/specify7/pull/4057))

## [7.9.1](https://github.com/specify/specify7/compare/v7.9.0...v7.9.1) (19 October 2023)

### Added
* Added an "Attachment Gallery" for records with more than one attachment ([#3624](https://github.com/specify/specify7/pull/3624))
* Added an all-new "[Tree Split Viewer](https://discourse.specifysoftware.org/t/trees-in-specify-7/534#split-tree-viewer-split_-11)", supporting both horizontal and vertical splits, syncing, and more ([#3969](https://github.com/specify/specify7/pull/3969) – *Requested by RBGE, UT Austin, and others*)
	* This helps with performing synonymy, moves and merging nodes in large trees
	* New icons for tree actions and customization have been added
* Made full name updates on tree changes more efficient ([#3175](https://github.com/specify/specify7/pull/3175))
* Added a "Clear All" button in the  notifications dialog ([#3893](https://github.com/specify/specify7/pull/3893))
* Added the ability to switch to 'Basic View' and 'Hide Field Mapper' in embedded query dialogs ([#3850](https://github.com/specify/specify7/pull/3850))
* A search box has been added to the home screen ([#3835](https://github.com/specify/specify7/pull/3835))
* Added automatic tests for `useBooleanState` hook ([#4021](https://github.com/specify/specify7/pull/4021))
* Proudly added new SCC Founding Partners to the About dialog ([#4040](https://github.com/specify/specify7/pull/4040))
	* Muséum d'Histoire Naturelle Geneva (Switzerland)
	* Consejo Superior de Investigaciones Científicas (Spain)

### Changed
* Disabled transparent background in tree headings ([#3460](https://github.com/specify/specify7/pull/3460))
* Added a maximum height for attachment image previews ([#3390](https://github.com/specify/specify7/pull/3390))
* Improved Security and Accounts user interface ([#3778](https://github.com/specify/specify7/pull/3778))
* Added a ring around color pickers ([#3779](https://github.com/specify/specify7/pull/3779))
* Removed contractions in error message ([#3978](https://github.com/specify/specify7/pull/3978))
* Relative dates now refresh every second ([#3845](https://github.com/specify/specify7/pull/3845))

### Fixed
* Stopped the `Create CSV` export function from breaking when commas are included in the records. ([#3946](https://github.com/specify/specify7/pull/3946) – *Reported by AAFC*)
	* Added separators in strings to avoid confusion with export separator 
* Fixed form padding and rounded corners on forms in Firefox ([#3827](https://github.com/specify/specify7/pull/3827))
* Users are no longer prompted to save after only selecting an input field ([#4025](https://github.com/specify/specify7/pull/4025))
* Text area fields in the Agent Merging can now only be expanded vertically ([#3916](https://github.com/specify/specify7/pull/3916))
* Specify now enables the `Set Collections` button when user is set as a Specify 6 admin ([#3755](https://github.com/specify/specify7/pull/3755) – *Requested by CSIRO, NMSU, and others*)
* Results table in the Query Builder will no longer show if all fields are hidden ([#3852](https://github.com/specify/specify7/pull/3852))
* `Export to CSV` button is now hidden when no fields are displayed ([#3848](https://github.com/specify/specify7/pull/3848))
* When creating an interaction, preparations will now show a count of 0 instead of "NaN" when the count is not defined ([#4006](https://github.com/specify/specify7/pull/4006))
* Add warning dialog when no prep available in disposal ([#4030](https://github.com/specify/specify7/pull/4030))
* Improved notification fetching performance by only fetching newly added notifications
([#3346](https://github.com/specify/specify7/pull/3346))
* Fixed an issue causing forms to shift while browsing in forms ([#3927](https://github.com/specify/specify7/pull/3927))
* Constrained the size of the side menu in the Security and Accounts panel for better compatibility with narrow/small screens ([#3914](https://github.com/specify/specify7/pull/3914))
* Data Set transferring link now opens in a new tab ([#4024](https://github.com/specify/specify7/pull/4024))
  
## [7.9.0](https://github.com/specify/specify7/compare/v7.8.13...v7.9.0) (25 September 2023)

Specify 7.9 is a major update, introducing the new **Statistics Page**, **Agent Merging**, **Basic Query View**, and numerous behind the scenes improvements and bug fixes. [Learn more](https://discourse.specifysoftware.org/t/specify-7-9-release-announcement/1308).

### Added
- [Statistics page](https://discourse.specifysoftware.org/t/statistics-panel-for-specify-7/828) ([#501](https://github.com/specify/specify7/issues/501), [#3760](https://github.com/specify/specify7/issues/3760), [#3662](https://github.com/specify/specify7/issues/3662), [#3687](https://github.com/specify/specify7/issues/3687), [#3722](https://github.com/specify/specify7/issues/3722), [#3670](https://github.com/specify/specify7/issues/3670) *– Requested by CSIRO, CSIC, NHMD, SDSU, The University of Michigan, TERN, KU, Muséum d'histoire naturelle Genève, Cleveland Museum, and many others*)
- [Agent merging](https://discourse.specifysoftware.org/t/record-merging-in-specify-7/939/9) ([#3864](https://github.com/specify/specify7/pull/3864), [#3887](https://github.com/specify/specify7/issues/3887), [#3832](https://github.com/specify/specify7/pull/3832), [#3818](https://github.com/specify/specify7/pull/3818), [#3894](https://github.com/specify/specify7/pull/3894), [#3855](https://github.com/specify/specify7/pull/3855), [#3846](https://github.com/specify/specify7/pull/3846), [#3822](https://github.com/specify/specify7/issues/3822), [#3818](https://github.com/specify/specify7/pull/3818), [#3842](https://github.com/specify/specify7/pull/3842), [#3838](https://github.com/specify/specify7/pull/3838), [#3825](https://github.com/specify/specify7/pull/3825), [#3809](https://github.com/specify/specify7/pull/3809), [#3474](https://github.com/specify/specify7/pull/3474) *– Requested by RBGE, AAFC-AAC, CSIRO, CSIC, The University of Michigan, and many others*)
- Simple query interface ([#2479](https://github.com/specify/specify7/issues/2479) *– Requested by Muséum d'histoire naturelle Genève*)
- The field mapper can now be hidden in query dialogs ([#3745](https://github.com/specify/specify7/issues/3745))
- The Specify logo now reflects the custom color chosen in User Preferences ([#2210](https://github.com/specify/specify7/issues/2210))
- Dismissible errors are now shown as 'toasts', allowing the user to dismiss warnings ([#2957](https://github.com/specify/specify7/issues/2957))
- Major improvements and refactoring of all business rules ([#2924](https://github.com/specify/specify7/issues/2924))
	- Implemented a uniqueness rule system that is respected by the frontend and backend
	- Created a new `type` for Uniqueness Rules
	- Allow users to safely dismiss business rule errors
	- Created and improved business rule automatic tests
- Added the ability for users to change the attachment preview mode between full resolution and thumbnails ([#3391](https://github.com/specify/specify7/issues/3391) *– Requested by New Mexico State University Herbarium*)
- Subviews visualized as buttons will now have a highlighted ring around the button to indicate records exist ([#2326](https://github.com/specify/specify7/issues/2326) *– Requested by Muséum d'histoire naturelle Genève*)
- Results can now be exported to CSV from the query dialog ([#3616](https://github.com/specify/specify7/issues/3616))
- Miscellaneous localization improvements on behalf of Weblate ([#4003](https://github.com/specify/specify7/pull/4003))
- The deletion blocker dialog has been overhauled, allowing uses to review a comprehensive list of records obstructing deletion ([80087a2](https://github.com/specify/specify7/commit/80087a29f4547c5c9fbd9ca37fd40309241af3fb))

### Changed
- MariaDB 10.11 is now the recommended DBMS and the `docker-compose` file has been updated accordingly ([#3743](https://github.com/specify/specify7/issues/3743))
- The button to go to the top of a query has been changed from `Edit Sp Query` to an arrow icon
- The navigation menu now is dark in both dark and light mode ([#3554](https://github.com/specify/specify7/issues/3554))
- The Specify logo has been updated with a transparent background ([#2210](https://github.com/specify/specify7/issues/2210))
- App resources can now be edited, saved, and created in full screen view ([#3768](https://github.com/specify/specify7/issues/3768))
- Query lines now are scrollable horizontally on narrow windows ([#3945](https://github.com/specify/specify7/pull/3945))
- Query item ordering buttons have been removed on narrow windows, instead, drag and drop is encouraged ([#3945](https://github.com/specify/specify7/pull/3945))
- Query items in detailed view now are wrapped on narrow windows ([#3877](https://github.com/specify/specify7/pull/3877))
- Atomic save is now used to check for integrity errors when merging records ([#3802](https://github.com/specify/specify7/issues/3802))
- The 'Browse In Forms', 'Create Record Set', and 'GeoMap' buttons will no longer display if the query returns no results ([#3796](https://github.com/specify/specify7/issues/3796))
- Improved instructions for running Django migrations ([#3626](https://github.com/specify/specify7/issues/3626))
- Subviews are no longer centered vertically by default and customization options have been added ([#2108](https://github.com/specify/specify7/issues/2108))
- Buttons are now right-aligned in toolbars instead of centered ([#3681](https://github.com/specify/specify7/issues/3681))

### Fixed
- Solved an issue with display formatters and aggregators that resulted in an incorrect count when calculating statistics ([db7f014](https://github.com/specify/specify7/commit/db7f0140c5d47cf714f76a1a8ea39f6024e79195))
- The button that creates new record sets when working in a temporary set of records now shows 'Creating new record' on hover rather than 'newRecordSet'
- Taxon records now will be marked as accepted if there is no accepted taxon given when saved ([2c2faa9e9](https://github.com/specify/specify7/commit/2c2faa9e9))
- Fixed Loan Return Preparation counts being calculated incorrectly ([#3981](https://github.com/specify/specify7/issues/3981) *– Reported by CSIRO*)
- Business rule automatic tests have been rewritten to ensure the order of operations are correct ([#3792](https://github.com/specify/specify7/pull/3792))
- The `uniqueIdentifier` field is now globally unique in the Collection Object, Collecting Event, and Locality tables.
- Proper scoping is now used for pick lists defined on a table or field from a table ([#3901](https://github.com/specify/specify7/issues/3901) *– Reported by The University of Michigan*)
- The `ordinal` field now is automatically set by a backend business rule if none is provided ([#3788](https://github.com/specify/specify7/issues/3788))
- Added uniqueness constraints for Accession Agent on Repository Agreement ([#133](https://github.com/specify/specify7/issues/133)).
- Resolved an issue where navigating between records in record sets displayed a warning indicating that the record was not saved. ([#3259](https://github.com/specify/specify7/issues/3259))
- Fixed hidden locality fields being added when sorting columns via the query results table ([#3725](https://github.com/specify/specify7/issues/3725), [#3733](https://github.com/specify/specify7/issues/3733), [#3683](https://github.com/specify/specify7/issues/3683))
- Button sizes in the WorkBench are now unified ([#3727](https://github.com/specify/specify7/pull/3727))
- Fixed a bug encountered when querying just the (formatted) table record in some cases ([#3721](https://github.com/specify/specify7/issues/3721))
- Fixed some cases when buttons are not centered ([b07c6d5](https://github.com/specify/specify7/commit/b07c6d5644ecde060c8a0a82c1c3ac8fe288f011))
- Text in dark mode buttons no longer is too bright upon hover ([eac4e7e](https://github.com/specify/specify7/commit/eac4e7e589af48efe1c7b1563dd8ccf592fcb685))

## [7.8.13](https://github.com/specify/specify7/compare/v7.8.12...v7.8.13) (5 July 2023)

### Changed
- The first field on any form is now "focused" by default when viewing a new form or subview ([#1543](https://github.com/specify/specify7/issues/1543) – *Requested by KU and others*)
- Editing Preparation Type now shows available options from the pick list form.
- The front-end limit on the number of pick list items has been removed ([#3482](https://github.com/specify/specify7/issues/3482)).

### Fixed
- WorkBench errors are now reported and navigable properly ([#3635](https://github.com/specify/specify7/issues/3635))
- Tree button states now properly reset when switching between trees ([#3578](https://github.com/specify/specify7/issues/3578))
- Pressed buttons no longer resemble disabled buttons ([#3547](https://github.com/specify/specify7/issues/3547))
- "Find Usages" button is no longer available when creating a new record ([#3549](https://github.com/specify/specify7/issues/3549))

### Added
- Alternative text has been added for the attachment preview and a new label has been added for the "Share Record" box ([#2615](https://github.com/specify/specify7/issues/2615), [#967](https://github.com/specify/specify7/issues/967), [#987](https://github.com/specify/specify7/issues/987))

## [7.8.12](https://github.com/specify/specify7/compare/v7.8.11...v7.8.12) (13 June 2023)

### Added
- Collection Object Relationships can now be uploaded in the WorkBench ([#3089](https://github.com/specify/specify7/issues/3089) *- Requested by CSIRO and others*)
- The language picker on the login screen now has a "Language" subheading above, consistent with username and password ([#3530](https://github.com/specify/specify7/issues/3530))
- The new `[intert]` attribute has been added to dialogs to help with accessibility and focusability in browsers for dialogs ([#2618](https://github.com/specify/specify7/issues/2618))
- Specify Network is now integrated into Specify 7! ([#2265](https://github.com/specify/specify7/issues/2265), [#3064](https://github.com/specify/specify7/issues/3064))
- Button colors in the interface can now be customized application-wide ([#2091](https://github.com/specify/specify7/issues/2091) *- Requested by CSIRO and others*)
- The Spanish localization has been improved thanks to Iñigo Granzow de la Cerda at CSIC! ([#3469](https://github.com/specify/specify7/pull/3469))
- "Skeleton loaders" have been added to improve the user experience when waiting for items to load in place of dialogs ([#2998](https://github.com/specify/specify7/issues/2998))
- Institutions can now be added to the navigation menu ([#2100](https://github.com/specify/specify7/issues/2100))

### Changed
- Small buttons now are darker when hovered over in light mode and lighter when hovered over in dark mode. These buttons were previously orange. ([#3543](https://github.com/specify/specify7/pull/3543))
- When using the attachment viewer, the hide form button now has a different value based on whether the form is displayed or not. ([#3479](https://github.com/specify/specify7/issues/3479))
- The paginator now uses proper icons for the navigation arrows. ([#3536](https://github.com/specify/specify7/issues/3536))
- "Express Search" is now known as "Simple Search" to be consistent with Specify 6.

### Fixed
- Console errors caused by exiting query builder have been removed ([#3523](https://github.com/specify/specify7/issues/3523))
- Auto-generated tree queries are no longer missing the second quote when using the English language ([#3126](https://github.com/specify/specify7/issues/3126))
- Export to CSV now respects the selected rows ([#2348](https://github.com/specify/specify7/issues/2348) *– Reported by CSIRO*)
- App resources can now be edited on narrow screens ([#3437](https://github.com/specify/specify7/issues/3437))
- When viewing interaction-based data forms, Interactions is now highlighted in the navigation menu ([#3459](https://github.com/specify/specify7/issues/3459))

## [7.8.11](https://github.com/specify/specify7/compare/v7.8.10...v7.8.11) (17 May 2023)

### Added
- Records are now navigable using a paginator after creating new records in the same data entry session ([#511](https://github.com/specify/specify7/issues/511) – *Requested by many users*)
- A new attachment picker has been added for choosing attachments stored on the asset server ([#2999](https://github.com/specify/specify7/issues/2999))
- German (Switzerland) has been added to our localization platform, [Weblate](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956/5) ([#3455](https://github.com/specify/specify7/pull/3455) – *Requested by NMBE*)

### Changed
- Action buttons that are opposite to the main user actions when a dialog is opened have been moved to the left side in dialogs ([#2620](https://github.com/specify/specify7/pull/3345))
- Users can no longer query the "root" node of a tree ([#3442](https://github.com/specify/specify7/issues/3442))

### Fixed
- When adding an unassociated preparation to a loan, the add dialog will now disappear ([#2164](https://github.com/specify/specify7/issues/2164))
- Draggable query lines are no longer displayed behind the dialog ([#3279](https://github.com/specify/specify7/issues/3279))
- Spaces are now enterable anywhere in the coordinates plugin on the Locality form ([#3354](https://github.com/specify/specify7/issues/3354) – *Reported by The University of Texas at Austin*)
- Collection Object Relationship plugins no longer display a false loading indicator ([#3294](https://github.com/specify/specify7/issues/3294)) 
- Circular mappings are now removed in the WorkBench automapper unless the table is self-referential ([#888](https://github.com/specify/specify7/issues/888) – *Requested by many users*)
- Loans can now be created after invalid identifiers are added without reopening the creation dialog ([#2280](https://github.com/specify/specify7/issues/2280))
- Modern tooltips no longer display on top of the contents in query combo boxes ([#3401](https://github.com/specify/specify7/issues/3401) – *Reported by Royal Botanic Gardens Edinburgh*)
- Creating new loans now works as expected ([#3397](https://github.com/specify/specify7/issues/3397), [#3462](https://github.com/specify/specify7/issues/3462), [#3453](https://github.com/specify/specify7/issues/3453), [#3486](https://github.com/specify/specify7/issues/3486) – *Reported by Virginia Institute of Marine Science*)

## [7.8.10](https://github.com/specify/specify7/compare/v7.8.9...HEAD) (1 May 2023)

### Added
- Add support for relative dates in full date queries (Queries using relative dates will not be visible in Specify 6 'Saved Queries'. By default, they will appear in 'Other Queries'. 
- Add support for picking the Current User as name in queries that end with Specify User (Queries using Current User will not be Specify 6 'Saved Queries'. By default, they will appear in 'Other Queries'.

### Fixed
- Available resources for creating are now properly scoped
- A minor visual glitch in Auto Complete Input Box has been fixed for slower machines

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

