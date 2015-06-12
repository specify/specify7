define([
    'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'populateform', 'savebutton', 'deletebutton', 'specifyform',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, schema, navigation, populateform,
            SaveButton, DeleteButton, specifyform) {
    "use strict";

    return Backbone.View.extend({
        __name__: "EditRecordSetDialog",
        className: "recordset-edit-dialog",
        initialize: function(options) {
            this.recordset = options.recordset;
            this.model = schema.getModelById(this.recordset.get('dbtableid'));
        },
        render: function() {
            specifyform.buildViewByName('RecordSet').done(this._render.bind(this));
            return this;
        },
        _render: function(form) {
            form.find('.specify-form-header:first').remove();
            var buttons = $('<div class="specify-form-buttons">').appendTo(form);

            if (!this.readOnly) {
                var saveButton = new SaveButton({ model: this.recordset });
                saveButton.render().$el.appendTo(buttons);
                saveButton.on('savecomplete', this.recordset.isNew() ?
                              this.gotoForm : this.close, this);
            }
            var title = (this.recordset.isNew() ? "New " : "") + this.recordset.specifyModel.getLocalizedName();

            if (!this.recordset.isNew() && !this.readOnly) {
                var deleteButton = new DeleteButton({ model: this.recordset });
                deleteButton.render().$el.appendTo(buttons);
                deleteButton.on('deleted', this.close, this);
            }

            populateform(form, this.recordset);

            this.$el.append(form).dialog({
                width: 'auto',
                title: title,
                modal: true,
                close: function() { $(this).remove(); }
            });
        },
        gotoForm: function() {
            // TODO: got to be a better way to get the url
            var url = $.param.querystring(new this.model.Resource().viewUrl(),
                                          {recordsetid: this.recordset.id});
            navigation.go(url);
        },
        close: function() {
            this.$el.dialog('close');
        }
    });
});
