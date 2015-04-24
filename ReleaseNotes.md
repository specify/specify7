

Specify 7.0.1
=============

Overview
--------
* View-only tree module.
* Report / label generation.
* Query engine improvements.
* Bug fixes / UI improvements.

Details
-------
* skip query selection dialog if there are no saved queries.
* fix picklist handling of null values in picklists from existing tables.
* fix Google Map plugin for localities with missing coordinates.
* fixed cursor pointers on hovered links
* fix bug in filter by logged in collection for Storage records.
* ['ui.formatting.scrdateformat'] expected to be a string, this is not the case on specify 6.6 thick clients installed from scratch.
* remove sync from specify panel.
* fix paths in specify panel.
* add message for case that report query returns no results.
* position tree nodes based on rank.
* include root nodes in tree view.
* improve tree task dialog.
* use remote pref for tree rank statistics threshold.
* adjust tree statistics.
* fix business rules for non-nullable fields in attachment tables. fixes #52
* change "Nothing here..." to "No Data" in form table.
* fix express search primary results formatting.
* fix query counts for distinct queries.
* support 'alpha' field types in ui field formatters. fixes #53
* don't wrap tree node labels.
* add deletion policies for loan related tables
* don't ignore tree rank fields in root tables of queries. fixes #58
* fix tree field joins in queries. fixes bugzilla 10053.
* eliminate concept of deferred values from queries. it doesn't seem to speed things up that much and complicates the code.
* don't reject barcode generation expressions in report definitions.
* adjust layout of tree node in tree viewer.
* only show chrono and litho trees for paleo collections. fixes bugzilla 10057.
* support report parameters (strings only).
* make tree node names expand instead of linking to form.
* add context menu to tree view.
* add ability to create queries from tree view.
* fix reports with no parameters.
* tree-context-menu finish adding tree view -> query function.
* set page title for tree task.
* immediately blur query button when it is pressed to avoid it being activated by the space bar inadvertently by people trying to page down.
* don't use border-collapse in tree view. workaround for firefox table rendering bug. fixes bugzilla 10058.
* add search to trees.
* implement serialization of tree conformation in url.
* add taxonomy to query from tree default fields.
* separate fetching tree nodes and stats into two independent request to improve node opening response time.
* fix field validation tooltip blinking.
* add keyboard navigation to tree view.
* default to using the raw field name in the query builder if no localized name is defined.
* fix attachment browser bug for bad tableIds.
* don't totally abort on 'many-to-many' relationships. fixes bugzilla 10088.
* add collection filtering rules for paleo trees. fixes bugzilla 10093.
* change query field "in" operator to accept values one-by-one. allows values to be validated. see bugzilla 10094.
* add specify 6 master key generator tool.
* return literal "Aggregator not defined." for query fields with undefined aggregators. fixes bugzilla 10100.
* add period to "No Data" message for formtable and recordselector.
* sort determinations so that the current one appears first.
