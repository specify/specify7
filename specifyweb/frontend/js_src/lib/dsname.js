"use strict";
const $ = require('jquery');
const Backbone = require('./backbone.js');
const uniquifyName = require('./wbuniquifyname.js');
const schema = require('./schema.js');

module.exports = Backbone.View.extend({
    __name__: "DataSetNameView",
    events: {
        'click .ui-icon': 'startEditing',
        'keyup input': 'keyUp'
    },
    initialize({dataset}) {
        this.dataset = dataset;
    },
    render() {
        this.$el
            .text('Dataset: ' + this.dataset.name)
            .append('<span class="ui-icon ui-icon-pencil" title="Edit name">Edit name</span>');
        return this;
    },
    startEditing(e) {
        this.$el
            .text('Dataset: ')
            .append(`<input type="text" maxlength="255">`);
        this.$('input').val(this.dataset.name).focus();
    },
    keyUp(e) {
        switch (e.keyCode) {
        case 13: // enter
            this.setName();
            break;
        case 27: // esc
            this.render();
            break;
        }
    },
    setName() {
        const $input = this.$('input');
        if ($input.val().trim() === this.dataset.name) {
            this.render();
        } else {
            $input.prop('readonly', true).css('cursor', 'progress');
            uniquifyName($input.val(), this.dataset.id).done(name => {
                $input.val(name);
                $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
                    type: "PUT",
                    data: JSON.stringify({name: name}),
                    contentType: "application/json",
                    processData: false
                }).done(() => {
                    this.dataset.name = name;
                    this.render();
                });
            });
        }
    }
});
