"use strict";

var $ = require('jquery');
var _ = require('underscore');

var schema         = require('./../schema.js');
var attachmentserverbase = require('./attachments.js');
var settings = require('./../attachmentsettings.js');


function placeholderforlorisauthentication(notused) {
    return $.get('/attachment_gw/get_token/', { filename: 'asfdas' });
}

var attachmentserverpublic = {
  servername: 'LORIS',
  getThumbnail: function(attachment, scale) {
      scale || (scale = 256);
      var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";
      var base_url = settings.public_image_server_base_url;
      var attachmentlocation = attachment.get('attachmentlocation');
      return placeholderforlorisauthentication(attachmentlocation).pipe(function(token) {
          return $('<img>', {src: `${base_url}/${attachmentlocation}/full/${scale},/0/default.jpg`, style: style});
      });
  },
  uploadFile: function(file, progressCB) {
      var formData = new FormData();
      var attachment;

      formData.append('media', file);
      var attachmentlocation = file.name;
      
      return $.ajax({
              url: settings.public_image_server_fileupload_url,
              type: 'POST',
              data: formData,
              processData: false,
              contentType: false,
          }).pipe(function() {
          var attachment = new schema.models.Attachment.Resource({
              attachmentlocation: attachmentlocation,
              mimetype: file.type,
              origfilename: file.name,
              ispublic: 1,
              servername: 'LORIS',
          });
          return attachment;
      });
  },
  openOriginal: function(attachment) {
      var attachmentlocation = attachment.get('origfilename');
      var base_url = settings.public_image_server_base_url;
      var src = `${base_url}/${attachmentlocation}/full/full/0/default.jpg`;
      window.open(src);
  }
};

module.exports = Object.assign(Object.create(attachmentserverbase), attachmentserverpublic);
