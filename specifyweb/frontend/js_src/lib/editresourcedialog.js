"use strict";

import $ from 'jquery';
import Backbone from './backbone';

import populateform from './populateform';
import SaveButton from './savebutton';
import DeleteButton from './deletebutton';
import specifyform from './specifyform';

import commonText from './localization/common';
import {className} from "./components/basic";


export default Backbone.View.extend({
        __name__: "EditResourceDialog",
    initialize: function({
        resource,
        deleteWarning,
        onRendered,
        onClose,
    }) {
        this.resource = resource;
        this.deleteWarning = deleteWarning;
        this.handleRendered = onRendered;
        this.handleClose = onClose;
    },
        render: function() {
            var viewName = this.resource.specifyModel.view || this.resource.specifyModel.name;
            specifyform.buildViewByName(viewName).done(this._render.bind(this));
            return this;
        },
        _render: function(form) {
            form.find('.specify-form-header:first').remove();
            var buttons = $(`<div class="${className.formFooter}" role="toolbar">`).appendTo(form);

            if (!this.readOnly) {
                var saveButton = new SaveButton({ model: this.resource });
                saveButton.render().$el.prependTo(buttons);
                saveButton.bindToForm(form[0].querySelector('form'));
                saveButton.on('saving', this.trigger.bind(this, 'saving'));
                saveButton.on('savecomplete', function() {
                    this.remove();
                    this.trigger('savecomplete', this, this.resource);
                }, this);
            }

            if (!this.resource.isNew() && !this.readOnly) {
                var deleteButton = new DeleteButton({ model: this.resource, warning: this.deleteWarning });
                deleteButton.render().$el.prependTo(buttons);
                deleteButton.on('deleting', this.trigger, this);
            }

            populateform(form, this.resource);

            const resourceLabel = this.resource.specifyModel.getLocalizedName();

            this.$el.append(form).dialog({
                width: 'auto',
                title: this.resource.isNew() ?
                    commonText('newResourceTitle')(resourceLabel) :
                    resourceLabel,
                modal: true,
                close: (event)=>this.remove(event),
            });

            this.handleRendered?.();
        },
        remove(event) {
            this.handleClose?.(event);
            Backbone.View.prototype.remove.call(this);
        }
    });

