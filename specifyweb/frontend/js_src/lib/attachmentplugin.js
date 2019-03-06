"use strict";

var $ = require('jquery');
var _ = require('underscore');


var api         = require('./specifyapi.js');
var UIPlugin    = require('./uiplugin.js');
var initialContext = require('./initialcontext.js');

var attachmentserverprivate = require('./attachments/attachments.js');
var attachmentserverpublic = require('./attachments/attachmentserverpublic.js');
var attachmentserveriip = require('./attachments/attachmentserveriip.js');

//var servers = {attachmentserverprivate: require('./attachments/attachments.js'),              
//              }

var settings;
initialContext.load('attachment_settings.json', data => settings = data);

module.exports =  UIPlugin.extend({
        __name__: "AttachmentsPlugin",
        events: {
            'change :file': 'fileSelected',
            'click .specify-attachment-display a': 'openOriginal'
        },
        render: function() {
            var self = this;
            if (!attachmentserverprivate) {
                self.$el.replaceWith('<div>Attachment server unavailable.</div>');
                return this;
            }
            var control = $('<div class="specify-attachment-container">');
            self.$el.replaceWith(control);
            self.setElement(control);
            if (self.model && self.model.get('attachment')) {
                self.model.rget('attachment', true).done(function(attachment) {
                    self.displayAttachment(attachment);
                });
            } else {
                self.addAttachment();
            }
            return this;
        },
        addAttachment: function() {
            this.$el.append('<form enctype="multipart/form-data">');
            var servers = Object.keys(settings.attachment_servers_js);
            var options = '';
            for (var i = 0; i < servers.length; i++){
                options += '<option value="' + servers[i] + '">' + servers[i][0].toUpperCase() + servers[i].substring(1).toLowerCase() + '</option>';
            }
            this.$el.append('Attachment Server: <select selected="PRIVATE" id="attachmentserver">'+options+'</select><input type="file" name="file"></form>');
         },
        fileSelected: function(evt) {
            var files = this.$(':file').get(0).files;
            if (files.length === 0) return;

            this.startUpload(files[0]);
        },
        startUpload: function(file) {
            var self = this;

            self.progressBar = $('<div class="attachment-upload-progress">').progressbar();

            self.progressDialog = $('<div>', {title: 'Uploading'})
                .appendTo(self.el)
                .append(self.progressBar)
                .dialog({ modal:true });
            
            var sel = this.$('#attachmentserver').get(0);
            var selected = sel.options[sel.selectedIndex];
            var attachmentserverjs = settings.attachment_servers_js[selected.value];
            console.log('./attachments/'+attachmentserverjs);
            //var attachmentserver = servers[attachmentserverjs];
            var attachmentserver = require('./attachments/'+attachmentserverjs);
            
            
            attachmentserver.uploadFile(file, function(progressEvt) {
                self.uploadProgress(progressEvt);
            }).done(function(attachment) {
                self.uploadComplete(attachment);
            });
        },
        uploadProgress: function (evt) {
            var self = this;
            if (evt.lengthComputable) {
                self.progressBar.progressbar('option', {
                    value: evt.loaded,
                    max: evt.total
                });
            } else {
                self.progressBar.progressbar('option', 'value', false);
            }
        },
        uploadComplete: function(attachment) {
            var self = this;
            self.trigger('uploadcomplete', attachment);
            self.model && self.model.set('attachment', attachment);
            self.displayAttachment(attachment);
            self.progressDialog.dialog('close');
        },
        displayAttachment: function(attachment) {
            var self = this;
            self.$el.empty().append('<div class="specify-attachment-display">');

            var attachmentservername = attachment.attributes.servername;
            var attachmentserverjs = settings.attachment_servers_js[attachmentservername];
            var attachmentserver = require('./attachments/'+attachmentserverjs);

            attachmentserver.getThumbnail(attachment).done(function(img) {
                $('<a>').append(img).appendTo(self.$('.specify-attachment-display'));
            });
        },
        openOriginal: function(evt) {
            evt.preventDefault();
            this.model.rget('attachment', true).done(function(attachment) {
                var attachmentservername = attachment.attributes.servername;
                var attachmentserverjs = settings.attachment_servers_js[attachmentservername];
                var attachmentserverjs = settings.attachment_servers_js[attachmentservername];
                var attachmentserver = require('./attachments/'+attachmentserverjs);
                attachmentserver.openOriginal(attachment);
            });
        }
    }, { pluginsProvided: ['AttachmentPlugin'] });
