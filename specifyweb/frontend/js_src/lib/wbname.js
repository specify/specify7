"use strict";
const Backbone = require('./backbone.js');
const uniquifyName = require('./wbuniquifyname.js');
const schema = require('./schema.js');

module.exports = Backbone.View.extend({
    __name__: "WBNameView",
    events: {
        'click .ui-icon': 'startEditing',
        'keyup input': 'keyUp'
    },
    initialize: function({wb}) {
        this.wb = wb;
    },
    render: function() {
        this.$el
            .text('Dataset: ' + this.wb.get('name'))
            .append('<span class="ui-icon ui-icon-pencil" title="Edit name">Edit name</span>');
        return this;
    },
    startEditing: function(e) {
        const maxLength = schema.models.Workbench.getField('name').length;
        this.$el
            .text('Dataset: ')
            .append(`<input type="text" maxlength="${maxLength}">`);
        this.$('input').val(this.wb.get('name')).focus();
    },
    keyUp: function(e) {
        switch (e.keyCode) {
        case 13: // enter
            this.setName();
            break;
        case 27: // esc
            this.render();
            break;
        }
    },
    setName: function() {
        const $input = this.$('input');
        if ($input.val().trim() === this.wb.get('name')) {
            this.render();
        } else {
            $input.prop('readonly', true).css('cursor', 'progress');
            uniquifyName($input.val()).done(name => {
                $input.val(name);
                this.wb.set('name', name);
                this.wb.save().done(() => this.render());
            });
        }
    }
});
