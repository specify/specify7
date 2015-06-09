define([
    'require', 'jquery', 'underscore', 'backbone', 'schema',
    'props', 'text!properties/resources_en.properties!noinline', 
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, props, resources_prop) {
    "use strict";

    var get_prop = _.bind(props.getProperty, props, resources_prop);

    return Backbone.View.extend({
        __name__: "PrepDialog",
        className: "prepdialog table-list-dialog",
	colobjModel: schema.getModel("collectionobject"),
	detModel: schema.getModel("determination"),
	prepModel: schema.getModel("preparation"),
	loanModel: schema.getModel("loan"),
	giftModel: schema.getModel("gift"),
	exchModel: schema.getModel("exchangeout"),

	//ui elements stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        render: function() {
            var table = $('<table>');
	    table.append(this.getTblHdr());
            var makeEntry = this.dialogEntry.bind(this);
	    _.each(this.options.preps, function(prep, index) {
		_.each(makeEntry(prep, index), function(entry) {
		    table.append(entry);
		});
            });
            this.$el.append(table);
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: this.getDlgTitle(),
                maxHeight: 700,
		width: 600,
                buttons: this.buttons()
            });
	    this.finishRender();

            return this;
        },

	//<<<<<<<<<<<<<<<<<<<< ui elements stuff

	//events >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        getIndex: function(evt, selector) {
            return this.$(selector).index(evt.currentTarget);
        },
	
	//<<<<<<<<<<<<<<<<<<<<<<< events

	getProp: function(key, fallback) {
	    var result = get_prop(key);
	    if (typeof result == 'undefined') {
		result = fallback;
	    }
	    return result;
	}


    });


});
