define(['jquery', 'underscore', 'uifield'], function($, _, UIField) {

    return UIField.extend({
        render: function() {
            var self = this;

            var setControl = function(value, format) {
                var formatted = self.format(format, value);
                self.setValue(formatted);
            };

            var fillItIn = function() {
                self.fetch().done(setControl);
            };

            fillItIn();
            self.model.onChange(self.fieldName, fillItIn);
            return this;
        },
        fetch: function() {
            return $.when(
                this.model.rget(this.fieldName),
                this.model.rget('collection.catalogNumFormatName'));
        },
        format: function(format, value) {
            this._format = format; // need this for validation
            return (format === 'CatalogNumberNumeric') ? parseInt(value, 10): value;
        },
        validate: function(value) {
            var result = {
                parsed: (this._format === 'CatalogNumberNumeric') ?
                    parseInt(value, 10) : value,
                isValid: true
            };
            if (_.isNaN(result.parsed)) {
                result.isValid = false,
                result.reason = "Numeric catalog number required."
            }
            return result;
        }
    });
});