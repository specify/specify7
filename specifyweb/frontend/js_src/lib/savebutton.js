"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import * as navigation from './navigation';
import formsText from './localization/forms';
import commonText from './localization/common';

let formId = 0;

export default Backbone.View.extend({
        __name__: "SaveButton",
        initialize: function() {
            this.blockingResources = {};
            this.saveBlocked = false;
            this.buttonsDisabled = true;
            this.destructors = [];

            if (this.model.isNew()) this.setButtonsDisabled(false, false);

            this.model.on('saverequired changing', function(_iresource) {
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
        setButtonsDisabled: function(disabled, updateUnloadProtect=true) {
            this.buttonsDisabled = disabled;
            if(this.buttons){
                if(disabled){
                    const dialog = document.activeElement.closest('.ui-dialog');
                    // Find and focus dialog close button
                    dialog?.getElementsByClassName('ui-dialog-titlebar-close')[0]?.focus();
                }
                this.buttons.prop('disabled', disabled);
            }
            if(updateUnloadProtect)
                if(disabled)
                    navigation.removeUnloadProtect(this);
                else
                    navigation.addUnloadProtect(this, formsText('unsavedFormUnloadProtect'));

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
            this.buttons = this.$('input');
            this.buttons.appendTo(this.el);

            // get buttons to match current state
            this.setButtonsDisabled(this.buttonsDisabled, false);
            this.setSaveBlocked(this.saveBlocked);

            return this;
        },
        bindToForm(form){
            if(form.id === ''){
                form.id = `form-${formId}`;
                formId+=1;
            }
            Array.from(this.buttons).forEach(button=>
                button.setAttribute('form',form.id)
            );

            this.form = form;

            const submit = this.submit.bind(this);
            this.form.addEventListener('submit',submit);
            this.destructors.push(()=>
                this.form.removeEventListener('submit',submit)
            );

            const handleFocus = this.handleFocus.bind(this);
            this.form.addEventListener('focusin', handleFocus);
            this.destructors.push(()=>
                this.form.removeEventListener('focusin',handleFocus)
            );

            const handleClick = (event)=>{
                if(event.target.type === 'button')
                    this.submit(event);

                /*
                 * If tried to submit form, untouched blank required fields are
                 * no longer hidden
                 *
                 * Can't do this inside of onsubmit handler, because
                 * onsubmit is only called on valid forms
                 * */
                this.form.classList.add('submitted');
            };
            Array.from(this.buttons).forEach(button=> {
                button.addEventListener('click', handleClick);
                this.destructors.push(()=>
                    button.removeEventListener('click', handleClick)
                );
            })
        },
        remove(){
            this.destructors.forEach(destructor => destructor());
            Backbone.View.prototype.remove.call(this);
        },
        handleFocus(event){
            if(
                event.target?.required === true
                || event.target?.hasAttribute('pattern')
            )
                /*
                 * Don't display "This is a required field" error or pattern
                 * mismatch message until input was interacted with
                 */
                event.target.classList.add('touched');
        },
        submit: function(event) {
            event.preventDefault();
            if(!this.buttonsDisabled && !this.saveBlocked){
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
