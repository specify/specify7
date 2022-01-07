"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import * as attachments from './attachments';
import router from './router';
import * as app from './specifyapp';
import schema, {getModel, getModelById} from './schema';
import populateform from './populateform';
import specifyform from './specifyform';
import * as navigation from './navigation';
import whenAll from './whenall';

import formsText from './localization/forms';
import commonText from './localization/common';
import {className} from './components/basic';
import template from './templates/attachmentbrowser.html';


export const AttachmentsView = Backbone.View.extend({
        __name__: "AttachmentsView",
        className: className.containerFull,
        title: commonText('attachments'),
        events: {
            'click .specify-attachment-thumbnail': 'openOriginal',
            'click .specify-attachment-dataobj-icon': 'openDataObj',
            'change select': 'selectChanged'
        },
        initialize: function() {
            var collections = this.attachmentCollections = {
                all: new schema.models.Attachment.LazyCollection({ domainfilter: true })
                // TODO:
                // So-called "unused" attachments now might be used in reports.

                // unused: new AttachmentModel.LazyCollection({
                //     filters: { tableid__isnull: true },
                //     domainfilter: true
                // })
            };

            var tablesWithAttachments = _( // TODO: get these from server or something
                ("accession agent borrow collectingevent collectionobject conservdescription conservevent " +
                 "dnasequence dnasequencingrun fieldnotebook fieldnotebookpageset fieldnotebookpage " +
                 "gift loan locality permit preparation referencework repositoryagreement taxon").split(" ")
            ).map(function(table) { return getModel(table); });

            _.each(tablesWithAttachments, function(table) {
                collections[table.tableId] = new schema.models.Attachment.LazyCollection({
                    filters: { tableid: table.tableId },
                    domainfilter: true
                });
            });

            _.each(collections, function(collection) {
                collection.filters.orderby = "-timestampcreated"; // TODO: not really a filter
            });

            this.attachments = collections.all;
        },
        index: function() {
            return this.$('.specify-attachment-browser')[0].childElementCount;
        },
        makeThumbnail: function() {
            var cell = $('<div class="relative min-w-[10] min-h-[10]">');

            var attachment = this.attachments.at(this.index());
            var tableId = attachment.get('tableid');
            var title = attachment.get('title');

            var model = tableId != null && getModelById(tableId);
            var icon = model ? (model.system ? "/images/system.png" : model.getIcon()) :
                schema.models.Attachment.getIcon();

            $('<button>', {
                class: 'specify-attachment-dataobj-icon absolute left-0 top-0',
                title: model.getLocalizedName(),
            }).append($('<img>', {
                'class': "w-table-icon",
                src: icon,
                alt: model.getLocalizedName()
            })).appendTo(cell);

            attachments.getThumbnail(attachment, 123).done((img)=>
                $('<button>',{
                    class: 'bg-white rounded shadow-lg shadow-gary-600 specify-attachment-thumbnail flex justify-center items-center',
                    title,
                }).append(
                    img.addClass('max-w-full max-h-full object-contain').attr('alt', title)
                ).appendTo(cell)
            );

            return cell;
        },
        fillPage: function() {
            var browser = this.$('.specify-attachment-browser');

            // Fetch more attachments when within 200px of the bottom
            if (Math.max(browser[0].scrollTop, browser[0].clientHeight) + 200 > browser[0].scrollHeight) {
                while (this.index() < this.attachments.length)
                    browser.append(this.makeThumbnail());

                // Fetch more if not all are fetched are not already fetching
                if(!this.attachments.isComplete() && !this.attachments._fetch)
                    this.attachments.fetch().done(()=>this.fillPage());
            }
        },
        getCounts: function() {
            return whenAll(_.map(this.attachmentCollections, function(collection) {
                return collection.getTotalCount();
            }));
        },
        render: function() {
            var self = this;
            self.$el.html(template({formsText, commonText}));

            self.$('.specify-attachment-browser').scroll(function() { self.fillPage(); });

            self.getCounts().done(function(counts) {
                var cols = self.attachmentCollections;
                var tables = $(`<optgroup
                    label="${formsText('tables')}
                "></optgroup>`);

                let hasAttachments = false;
                let i = 0;
                _.each(self.attachmentCollections, function(collection, key) {
                    var count = counts[i++];
                    var name = key === 'all' ? "All" : key === 'unused' ? "Unused" :
                            getModelById(parseInt(key)).getLocalizedName();

                    var parent = _(['all', 'unused']).contains(key) ? self.$('select') : tables;

                    if(count > 0){
                        parent.append('<option value="' + key + '">' + name + ' - ' + count + '</option>');
                        hasAttachments=true;
                    }
                });

                if(!hasAttachments)
                    tables.append(`<option disabled selected>${formsText('noAttachments')}</option>`);

                self.$('select').append(tables);
                self.fillPage();
            });

            return this;
        },
        openOriginal: function(evt) {
            var index = this.$('.specify-attachment-thumbnail').index(evt.currentTarget);
            var attachment = this.attachments.at(index);
            attachments.openOriginal(attachment);
        },
        openDataObj: function(evt) {
            var self = this;
            self.dialog && self.dialog.dialog('close');

            self.dialog = $('<div>').dialog({
                title: formsText('openDataDialogTitle'),
                modal: true
            });

            var index = self.$('.specify-attachment-dataobj-icon').index(evt.currentTarget);

            var attachment = self.attachments.at(index);
            var tableId = attachment.get('tableid');
            if (_.isNull(tableId)) {
                // TODO: something for unused attachments.
                //                self.buildDialog(attachment);
                return;
            }

            var model = getModelById(tableId);
            attachment.rget(model.name.toLowerCase() + 'attachments', true).pipe(function(dataObjs) {
                return dataObjs && dataObjs.length > 0 ? dataObjs.at(0).rget(model.name.toLowerCase()) : null;
            }).done(function(dataObj) {
                dataObj ? self.buildDialog(dataObj) : self.dialog.dialog('close');
            });
        },
        buildDialog: function(resource) {
            var self = this;
            specifyform.buildViewByName(resource.specifyModel.view, null, 'view').done(function(dialogForm) {
                dialogForm.find('.specify-form-header:first').remove();

                populateform(dialogForm, resource);

                self.dialog.dialog('close');
                var dialog = self.dialog = $('<div>').append(dialogForm).dialog({
                    width: 'auto',
                    position: { my: "top", at: "top+20", of: self.$('.specify-attachment-browser') },
                    title:  resource.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); self.dialog = null; }
                });

                if (!resource.isNew()) {
                    dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first').prepend(
                        `<a href="${resource.viewUrl()}">
                            <span class="ui-icon ui-icon-link">
                                ${formsText('linkInline')}
                            </span>
                        </a>`
                    );

                    dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                        evt.preventDefault();
                        navigation.go(resource.viewUrl());
                        dialog.dialog('close');
                    });
                }
            });
        },
        selectChanged: function() {
            this.attachments = this.attachmentCollections[this.$('select').val()];
            this.$('.specify-attachment-browser').empty();
            this.fillPage();
        }
    });

export default function() {
    router.route('attachments/', 'attachments', function () {
        app.setCurrentView(new AttachmentsView());
      });
};

