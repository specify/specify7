"use strict";

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');

module.exports = Backbone.View.extend({
    __name__: "GbifInfo",
    initialize() {
    },
    render() {
        $.get(`https://api.gbif.org/v1/occurrence/search?occurrenceId=${this.model.get('guid')}`)
            .done(gbifOccurrences => {
                if (gbifOccurrences.results.length === 1) {
                    const gbifOccurrence = gbifOccurrences.results[0];
                    const link = $('<a><img src="/static/img/gbif.png"/></a>');
                    if (gbifOccurrence.issues.length > 0) {
                        link.append("!").attr({
                            title: 'Data quality issues reported by GBIF.',
                        }).click(() => this.showIssues(gbifOccurrence));
                    } else {
                        link.attr({
                            title: 'Record indexed by GBIF.',
                            href: `https://www.gbif.org/occurrence/${gbifOccurrence.key}`
                        });
                    }
                    this.$el.append(link).show();
                    // this.$el.text(gbifOccurrences.results[0].issues).show();
                }
            });
    },
    showIssues(gbifOccurrence) {
        $('<div>')
            .append($('<ul>').append(gbifOccurrence.issues.map(
                issue => $('<li>').text(occurrenceIssueDefinitions[issue] || issue)
            )))
            .append($('<a>', {href: `https://www.gbif.org/occurrence/${gbifOccurrence.key}`}).text("View occurrence at GBIF."))
            .dialog({
                title: "Issues reported by GBIF",
                close: function() { $(this).remove(); },
                buttons: [
                    { text: 'Ok', click() { $(this).dialog('close'); } }
                ]
            });
    }
});


const occurrenceIssueDefinitions = {
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
