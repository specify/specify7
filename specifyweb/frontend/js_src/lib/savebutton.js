"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

const navigation = require('./navigation.js');
const formsText = require('./localization/forms').default;
const commonText = require('./localization/common').default;

module.exports =  Backbone.View.extend({
        __name__: "SaveButton",
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

            this.handleFormKeyPress = this.handleFormKeyPress.bind(this);
            this.handleFieldFocus = this.handleFieldFocus.bind(this);
        },
        setButtonsDisabled: function(disabled) {
            this.buttonsDisabled = disabled;
            this.buttons && this.buttons.prop('disabled', disabled);
            if(!disabled) {
                navigation.addUnloadProtect(this, formsText('unsavedFormUnloadProtect'));
            } else {
                navigation.removeUnloadProtect(this);
            }
        },
        setSaveBlocked: function(saveBlocked) {
            this.saveBlocked = saveBlocked;
            this.buttons && this.buttons[saveBlocked ? 'addClass' : 'removeClass']('saveblocked');
            /*
             * Don't disable the save button on validation errors
             * to allow for browser's native form validation
             * */
            this.buttons.prop('disabled', this.buttonsDisabled && !this.saveBlocked);
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
            this.el.setAttribute('role','toolbar');
            if (this.options.addAnother) {
                this.$el.append($('<input>', {
                    type: "button",
                    class: "save-and-add-button",
                    value: formsText('saveAndAddAnother')
                }));
            }
            this.$el.append($('<input>', {
                type: "submit",
                class: "save-button",
                value: commonText('save')
            }));
            this.buttons = this.$(':submit');
            this.buttons.appendTo(this.el);

            // get buttons to match current state
            this.setButtonsDisabled(this.buttonsDisabled);
            this.setSaveBlocked(this.saveBlocked);

            return this;
        },
        bindToForm(form){
            Array.from(this.buttons).forEach(button=>
                button.setAttribute('form',form.id)
            );
            this.form = form;
            this.form.addEventListener('submit',this.submit);
            this.form.addEventListener('keypress',this.handleFormKeyPress);
            this.form.addEventListener('focusout',this.handleFieldFocus);
        },
        handleFormKeyPress(event){
            if(event.key === 'Enter'){
                event.preventDefault();
                const modifiedEvent = event;
                event.submitter = this.$el.find('.save-button')[0];
                this.submit(modifiedEvent);
            }
        },
        handleFieldFocus(event){
            if(event.target.classList.contains('specify-field'))
                event.target.classList.add('touched');
        },
        remove(){
            this.form.removeEventListener('submit',this.submit);
            this.form.removeEventListener('keypress',this.handleFormKeyPress);
            this.form.removeEventListener('focusout',this.handleFieldFocus);
            Backbone.View.prototype.remove.call(this);
        },
        submit: function(event) {

            this.form.classList.add('submitted');

            if(this.buttonsDisabled || this.saveBlocked)
                event.preventDefault();
            else {
                const addAnother = $(event.submitter).is('.save-and-add-button');
                this.model.businessRuleMgr.pending.then(this.doSave.bind(this, addAnother));
            }

            return false;
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
                            $(`<div>
                                ${formsText('saveConflictDialogHeader')}
                                <p>${formsText('saveConflictDialogMessage')}</p>
                            </div>`).dialog({
                                title: formsText('saveConflictDialogTitle'),
                                resizable: false,
                                modal: true,
                                dialogClass: 'ui-dialog-no-close',
                                buttons: [{text: commonText('close'), click: function() {
                                    window.location.reload();
                                }}]
                            });
                        }
                    });
            } else {
                var dialog = $(`<div>
                    ${formsText('saveBlockedDialogHeader')}
                    <p>${formsText('saveBlockedDialogMessage')}</p>
                    <ul class="saveblockers"></ul>
                </div>`).appendTo(this.el).dialog({
                    title: formsText('saveBlockedDialogTitle'),
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
