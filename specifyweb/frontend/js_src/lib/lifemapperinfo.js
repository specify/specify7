"use strict";

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');

module.exports = Backbone.View.extend({
	__name__: "LifemapperInfo",
	initialize(){
		this.$el = arguments[0].el;
		this.model = arguments[0].model;
	},
	render(){

		const guid = 'fa7dd78f-8c91-49f5-b01c-f61b3d30caee';
		//const guid = this.model.get('guid');

		$.get(`http://notyeti-192.lifemapper.org/occ/tentacles/${guid}`)
			.done(response =>
				Object.entries(response).filter(([, results]) =>
					results.length === 1 &&
					typeof results[0]['spcoco.error'] === "undefined"
				).map(([key, response_data]) => {

					const response_handlers = {
						'GBIF Records': (occurrence) => {
							return {
								icon_name: 'gbif',
								formatted_name: 'GBIF',
								issues: occurrence.issues,
								issue_definitions: GBIFOccurrenceIssueDefinitions,
								href: `https://www.gbif.org/occurrence/${occurrence.key}`,
							};
						},
						'iDigBio Records': (occurrence) => {
							return {
								icon_name: 'idigbio',
								formatted_name: 'iDigBio',
								issues: occurrence.indexTerms.flags,
								issue_definitions: iDigBioOccurrenceIssueDefinitions,
								href: `https://www.idigbio.org/portal/records/${occurrence.data['dwc:occurrenceID']}`,
							};
						},
						'MorphoSource Records': (occurrence) => {
							return {
								icon_name: 'morphosource',
								formatted_name: 'MorphoSource',
								issues: occurrence.indexTerms.flags,
								issue_definitions: iDigBioOccurrenceIssueDefinitions,
								href: `https://www.idigbio.org/portal/records/${occurrence.data['dwc:occurrenceID']}`,
							};
						},
					};

					if (typeof response_handlers[key] !== "undefined")
						this.showSourceIcon(response_handlers[key](response_data[0]));
				})
			);
	},
	showSourceIcon(payload){

		const {
			icon_name,
			formatted_name,
			href,
			issues,
			issue_definitions
		} = payload;

		let title;

		const link = $(`<a target="_blank"><img src="/static/img/${icon_name}.png" alt="${formatted_name}"></a>`);

		if (issues.length === 0)
			title = `Record indexed by ${formatted_name}`;
		else {
			title = `Data quality issues reported by ${formatted_name}`;
			link.append('Issues Detected').click((event) => this.showIssues(event, issues, issue_definitions, formatted_name, href));
		}

		link.attr({
			title: title,
			href: href
		});

		this.$el.append(link).show();
	},
	showIssues(event, issues, issue_definitions, source_name, source_link){
		event.preventDefault();
		$('<div>')
			.append($('<ul>').append(issues.map(
				issue => $('<li>').text(issue_definitions[issue] || issue)
			)))
			.append($('<a>', {href: source_link, target: '_blank'}).text(`View occurrence at ${source_name}.`))
			.dialog({
				title: `Issues reported by ${source_name}`,
				close: function(){
					$(this).remove();
				},
				width: 600,
				buttons: [
					{
						text: 'Ok', click(){
							$(this).dialog('close');
						}
					}
				]
			});
	}
});


const GBIFOccurrenceIssueDefinitions = {
	"ZERO_COORDINATE": "Zero coordinate",
	"COORDINATE_OUT_OF_RANGE": "Coordinate out of range",
	"COORDINATE_INVALID": "Coordinate invalid",
	"COORDINATE_ROUNDED": "Coordinate rounded",
	"GEODETIC_DATUM_INVALID": "Geodetic datum invalid",
	"GEODETIC_DATUM_ASSUMED_WGS84": "Geodetic datum assumed WGS84",
	"COORDINATE_REPROJECTED": "Coordinate reprojected",
	"COORDINATE_REPROJECTION_FAILED": "Coordinate reprojection failed",
	"COORDINATE_REPROJECTION_SUSPICIOUS": "Coordinate reprojection suspicious",
	"COORDINATE_ACCURACY_INVALID": "Coordinate accuracy invalid",
	"COORDINATE_PRECISION_INVALID": "Coordinate precision invalid",
	"COORDINATE_UNCERTAINTY_METERS_INVALID": "Coordinate uncertainty meters invalid",
	"COORDINATE_PRECISION_UNCERTAINTY_MISMATCH": "Coordinate precision uncertainty mismatch",
	"COUNTRY_COORDINATE_MISMATCH": "Country coordinate mismatch",
	"COUNTRY_MISMATCH": "Country mismatch",
	"COUNTRY_INVALID": "Country invalid",
	"COUNTRY_DERIVED_FROM_COORDINATES": "Country derived from coordinates",
	"CONTINENT_COUNTRY_MISMATCH": "Continent country mismatch",
	"CONTINENT_INVALID": "Continent invalid",
	"CONTINENT_DERIVED_FROM_COORDINATES": "Continent derived from coordinates",
	"PRESUMED_SWAPPED_COORDINATE": "Presumed swapped coordinate",
	"PRESUMED_NEGATED_LONGITUDE": "Presumed negated longitude",
	"PRESUMED_NEGATED_LATITUDE": "Presumed negated latitude",
	"RECORDED_DATE_MISMATCH": "Recorded date mismatch",
	"RECORDED_DATE_INVALID": "Recorded date invalid",
	"RECORDED_DATE_UNLIKELY": "Recorded date unlikely",
	"TAXON_MATCH_FUZZY": "Taxon match fuzzy",
	"TAXON_MATCH_HIGHERRANK": "Taxon match higherrank",
	"TAXON_MATCH_NONE": "Taxon match none",
	"DEPTH_NOT_METRIC": "Depth not metric",
	"DEPTH_UNLIKELY": "Depth unlikely",
	"DEPTH_MIN_MAX_SWAPPED": "Depth min/max swapped",
	"DEPTH_NON_NUMERIC": "Depth non numeric",
	"ELEVATION_UNLIKELY": "Elevation unlikely",
	"ELEVATION_MIN_MAX_SWAPPED": "Elevation min/max swapped",
	"ELEVATION_NOT_METRIC": "Elevation not metric",
	"ELEVATION_NON_NUMERIC": "Elevation non numeric",
	"MODIFIED_DATE_INVALID": "Modified date invalid",
	"MODIFIED_DATE_UNLIKELY": "Modified date unlikely",
	"IDENTIFIED_DATE_UNLIKELY": "Identified date unlikely",
	"IDENTIFIED_DATE_INVALID": "Identified date invalid",
	"BASIS_OF_RECORD_INVALID": "Basis of record invalid",
	"TYPE_STATUS_INVALID": "Type status invalid",
	"MULTIMEDIA_DATE_INVALID": "Multimedia date invalid",
	"MULTIMEDIA_URI_INVALID": "Multimedia uri invalid",
	"REFERENCES_URI_INVALID": "References uri invalid",
	"INTERPRETATION_ERROR": "Interpretation error",
	"INDIVIDUAL_COUNT_INVALID": "Individual count invalid"
};

const iDigBioOccurrenceIssueDefinitions = {
	"datecollected_bounds": "Date Collected out of bounds (Not between 1700-01-02 and the date of Indexing). Date Collected is generally composed from dwc:year, dwc:month, dwc:day or as specified in dwc:eventDate.",
	"dwc_acceptednameusageid_added": "Accepted Name Usage ID (dwc:acceptedNameUsageID) added where none was provided.",
	"dwc_basisofrecord_invalid": "Darwin Core Basis of Record (dwc:basisOfRecord) missing or not a value from controlled vocabulary.",
	"dwc_basisofrecord_paleo_conflict": "Darwin Core Basis of Record (dwc:basisOfRecord) is not FossilSpecimen but the record contains paleo context terms",
	"dwc_basisofrecord_removed": "Darin Core Basis of Record (dwc:basisOfRecord) removed because of invalid value.",
	"dwc_class_added": "Darwin Core Class (dwc:class) added where none was provided.",
	"dwc_class_replaced": "Darwin Core Class (dwc:class) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_continent_added": "Darwin Core Continent (dwc:continent) added where none was provided.",
	"dwc_continent_replaced": "Darwin Core Continent (dwc:continent) replaced with a standardized value.",
	"dwc_country_added": "Darwin Core Country (dwc:country) added where none was provided.",
	"dwc_country_replaced": "Darwin Core Country (dwc:country) replaced with a standardized value from Getty Thesaurus of Geographic Names.",
	"dwc_datasetid_added": "Darwin Core Dataset ID (dwc:datasetID) added where none was provided.",
	"dwc_datasetid_replaced": "Darwin Core Dataset ID (dwc:datasetID) replaced with value from ? TBD",
	"dwc_family_added": "Darwin Core Family (dwc:family) added where none was provided.",
	"dwc_family_replaced": "Darwin Core Family (dwc:family) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_genus_added": "Darwin Core Genus (dwc:genus) added where none was provided.",
	"dwc_genus_replaced": "Darwin Core Genus (dwc:genus) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_infraspecificepithet_added": "Darwin Core Infraspecific Epithet (dwc:infraspecificEpithet) added where none was provided.",
	"dwc_infraspecificepithet_replaced": "Darwin Core Infraspecific Epithet (dwc:infraspecificEpithet) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_kingdom_added": "Darwin Core Kingdom (dwc:kingdom) added where none was provided.",
	"dwc_kingdom_replaced": "Darwin Core Kingdom (dwc:kingdom) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_kingdom_suspect": "Darwin Core Kingdom (dwc:kingdom) not replaced with a standardized value from GBIF Backbone Taxonomy due to insufficient confidence level.",
	"dwc_multimedia_added": "TBD",
	"dwc_order_added": "Darwin Core Order (dwc:order) added where none was provided.",
	"dwc_order_replaced": "Darwin Core Order (dwc:order) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_originalnameusageid_added": "Darwin Core Original Name Usage ID (dwc:originalNameUsageID) added where none was provided.",
	"dwc_parentnameusageid_added": "Darwin Core Parent Name Usage ID (dwc:parentNameUsageID) added where none was provided.",
	"dwc_phylum_added": "Darwin Core Phylum (dwc:phylum) added where none was provided.",
	"dwc_phylum_replaced": "Darwin Core Phylum (dwc:phylum) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_scientificnameauthorship_added": "Darwin Core Scientific Name Authorship (dwc:scientificNameAuthorship) added where none was provided.",
	"dwc_specificepithet_added": "Darwin Core Specific Epithet (dwc:specificEpithet) added where none was provided.",
	"dwc_specificepithet_replaced": "Darwin Core Specific Epithet (dwc:specificEpithet) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_stateprovince_replaced": "Darwin Core State or Province (dwc:stateProvince) replaced with a standardized value.",
	"dwc_taxonid_added": "Darwin Core Taxon ID (dwc:taxonID) added where none was provided.",
	"dwc_taxonid_replaced": "Darwin Core Taxon ID (dwc:taxonID) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_taxonomicstatus_added": "Darwin Core Taxonomic Status (dwc:taxonomicStatus) added where none was provided.",
	"dwc_taxonomicstatus_replaced": "Darwin Core Taxonomic Status (dwc:taxonomicStatus) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_taxonrank_added": "Darwin Core Taxon Rank (dwc:taxonRank) added where none was provided.",
	"dwc_taxonrank_invalid": "The supplied Darwin Core Taxon Rank (dwc:taxonRank) is not contained in controlled vocabulary (Taxonomic Rank GBIF Vocabulary).",
	"dwc_taxonrank_removed": "Darwin Core Taxon Rank (dwc:taxonRank) removed because it is not contained in controlled vocabulary (Taxonomic Rank GBIF Vocabulary).",
	"dwc_taxonrank_replaced": "Darwin Core Taxon Rank (dwc:taxonRank) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"dwc_taxonremarks_added": "Darwin Core Taxon Remarks (dwc:taxonRemarks) added none was provided.",
	"dwc_taxonremarks_replaced": "Darwin Core Taxon Remarks (dwc:taxonRemarks) replaced with a standardized value from GBIF Backbone Taxonomy.",
	"gbif_canonicalname_added": "GBIF Canonical Name added from GBIF Backbone Taxonomy.",
	"gbif_genericname_added": "GBIF Generic Name added from GBIF Backbone Taxonomy.",
	"gbif_reference_added": "GBIF Reference added from GBIF Backbone Taxonomy",
	"gbif_taxon_corrected": "A match in GBIF Backbone Taxonomy was found. Inverse of taxon_match_failed flag.",
	"gbif_vernacularname_added": "GBIF Vernacular Name (common name) added.",
	"geopoint_0_coord": "Geographic Coordinate contains literal '0' values.",
	"geopoint_bounds": "Geographic Coordinate out of bounds (valid range is -90 to 90 lat, -180 to 180 long)",
	"geopoint_datum_error": "Geographic Coordinate Datum (dwc:geodeticDatum) is Unknown or coordinate cannot be converted to WGS84.",
	"geopoint_datum_missing": "Geographic Coordinate is missing Geodetic Datum (dwc:geodeticDatum) (Assumed to be WGS84).",
	"geopoint_low_precision": "Geographic Coordinate contains a Low Precision value.",
	"geopoint_pre_flip": "Geographic Coordinate latitude and longitude replaced with swapped values. Prior to examining other factors, the magnitude of latitude was determined to be greater than 180, and the longitude was less than 90.",
	"geopoint_similar_coord": "Geographic Coordinate latitude and longitude are similar (+/- lat == +/- lon) and likely have data entry issue.",
	"idigbio_isocountrycode_added": "iDigBio ISO 3166-1 alpha-3 Country Code added.",
	"rev_geocode_both_sign": "Geographic Coordinate Latitude and Longitude negated to place point in correct country.",
	"rev_geocode_corrected": "Geographic Coordinate placed within stated country by reverse geocoding process.",
	"rev_geocode_eez": "Geographic Coordinate is outside land boundaries of stated country but does fall inside the country's exclusive economic zone water boundary (approx. 200 miles from shore) based on reverse geocoding process.",
	"rev_geocode_eez_corrected": "The reverse geocoding process was able to find a coordinate operation that placed the point within the stated country's exclusive economic zone.",
	"rev_geocode_failure": "Geographic Coordinate could not be reverse geocoded to a particular country.",
	"rev_geocode_flip": "Geographic Coordinate Latitude and Longitude replaced with swapped values to place point in stated country by reverse geocoding process.",
	"rev_geocode_flip_both_sign": "Geographic Coordinate Latitude and Longitude replaced with both swapped and negated values to place point in stated country by reverse geocoding process.",
	"rev_geocode_flip_lat_sign": "Geographic Coordinate Latitude and Longitude replaced with swapped values, Latitude negated, to place point in stated country by reverse geocoding process.",
	"rev_geocode_flip_lon_sign": "Geographic Coordinate Latitude and Longitude replaced with swapped values, Longitude negated, to place it in stated country by reverse geocoding process.",
	"rev_geocode_lat_sign": "Geographic Coordinate Latitude negated to place point in stated country by reverse geocoding process.",
	"rev_geocode_lon_sign": "Geographic Coordinate had its Longitude negated to place it in stated country.",
	"rev_geocode_mismatch": "Geographic Coordinate did not reverse geocode to stated country.",
	"scientificname_added": "Scientific Name (dwc:scientificName) added where none was provided with the value constructed by concatenation of stated genus and species.",
	"taxon_match_failed": "Unable to match a taxon in GBIF Backbone Taxonomy. Inverse of gbif_taxon_corrected flag."
};