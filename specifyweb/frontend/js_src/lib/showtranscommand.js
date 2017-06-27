"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UICmd            = require('./uicommand.js');

module.exports =  UICmd.extend({
    __name__: "ShowTransCommand",
    events: {
        'click': 'click'
    },
    initialize({populateForm}) {
        this.populateForm = populateForm;
    },
    click: function(evt) {
        evt.preventDefault();
        if (this.model.isNew() || this.model.get('id') == null) {
            $("<p>").append("Transactions cannot be displayed in this context.").dialog({
                modal: true,
                width: 500,
                title: this.$el[0].value,
                close: function() { $(this).remove(); }
            });
            return;
        };

        console.log(this.__name__ + ' clicked.');
    }
});
