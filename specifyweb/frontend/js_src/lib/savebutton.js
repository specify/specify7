"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var saveblocked = require('./templates/saveblocked.html');
var conflict = require('./templates/conflict.html');

module.exports =  Backbone.View.extend({
        __name__: "SaveButton",
        events: {
            'click :submit': 'submit'
        },
        initialize: function(options) {
            this.blockingResources = {};
            this.saveBlocked = false;
            this.buttonsDisabled = true;

            if (this.model.isNew()) this.setButtonsDisabled(false);

            this.model.on('saverequired changing', function(resource) {
                this.setButtonsDisabled(false);
            }, this);

            this.model.on('oktosave', function(resource) {
                this.removeBlocker(resource);
            }, this);

            this.model.on('saveblocked', function(blocker) {
                if (!this.blockingResources[blocker.resource.cid]) {
                    this.blockingResources[blocker.resource.cid] = blocker.resource.on('destroy', this.removeBlocker, this);
                }
                if (!blocker.deferred) this.setButtonsDisabled(true);
                if (!blocker.deferred) this.setSaveBlocked(true);
            }, this);
        },
        setButtonsDisabled: function(state) {
            this.buttonsDisabled = state;
            this.buttons && this.buttons.prop('disabled', state);
        },
        setSaveBlocked: function(saveBlocked) {
            this.saveBlocked = saveBlocked;
            this.buttons && this.buttons[saveBlocked ? 'addClass' : 'removeClass']('saveblocked');
        },
        removeBlocker: function(resource) {
            delete this.blockingResources[resource.cid];
            var onlyDeferreds = _.all(this.blockingResources, function(br) {
                return br.saveBlockers.hasOnlyDeferredBlockers();
            });
            if (onlyDeferreds) this.setSaveBlocked(false);
        },
        render: function() {
            this.$el.addClass('savebutton');
            this.$el.append($('<input>', {
                type: "submit",
                "class": "save-button",
                value: "Save"
            }));
            if (this.options.addAnother) {
                this.$el.append($('<input>', {
                    type: "submit",
                    "class": "save-and-add-button",
                    value: "Save and Add Another"
                }));
            }
            this.buttons = this.$(':submit');
            this.buttons.appendTo(this.el);

            // get buttons to match current state
            this.setButtonsDisabled(this.buttonsDisabled);
            this.setSaveBlocked(this.saveBlocked);
            return this;
        },
        submit: function(evt) {
            evt.preventDefault();
            var addAnother = $(evt.currentTarget).is('.save-and-add-button');
            this.model.businessRuleMgr.pending.then(this.doSave.bind(this, addAnother));
        },
        doSave: function(addAnother) {
            _.each(this.blockingResources, function(resource) {
                return resource.saveBlockers.fireDeferredBlockers();
            });

            if (_.isEmpty(this.blockingResources)) {
                this.setButtonsDisabled(true);

                // # This has to be done before saving so that the data we get back isn't copied.
                // # Eg. autonumber fields, the id, etc.
                var newResource = addAnother ? this.model.clone() : undefined;
                var wasNew = this.model.isNew();
                this.trigger('saving', this, this.model);
                this.model.save()
                    .done(this.trigger.bind(this, 'savecomplete', {
                        addAnother: addAnother,
                        newResource: newResource,
                        wasNew: wasNew
                    }))
                    .fail(function(jqXHR) {
                        if (jqXHR.status === 409) {
                            jqXHR.errorHandled = true;
                            $(conflict()).dialog({
                                resizable: false,
                                modal: true,
                                open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
                                buttons: [{text: "Reload", click: function() {
                                    window.location.reload();
                                }}]
                            });
                        }
                    });
            } else {
                var dialog = $(saveblocked()).appendTo(this.el).dialog({
                    resizable: false,
                    modal: true,
                    close: function() { return dialog.remove(); }
                });

                var list = dialog.find('.saveblockers').empty();

                _.each(this.blockingResources, function(resource) {
                    var li = $('<li>').appendTo(list);
                    li.append($('<h3>').text(resource.specifyModel.getLocalizedName()));
                    var dl = $('<dl>').appendTo(li);
                    _.each(resource.saveBlockers.getAll(), function(blocker) {
                        var field = blocker.field && resource.specifyModel.getField(blocker.field);
                        $('<dt>').text(field ? field.getLocalizedName() : '').appendTo(dl);
                        $('<dd>').text(blocker.reason).appendTo(dl);
                    });
                });
            }
        }
    });

