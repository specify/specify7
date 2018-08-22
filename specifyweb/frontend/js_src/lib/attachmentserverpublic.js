"use strict";

var $ = require('jquery');
var _ = require('underscore');

var schema         = require('./schema.js');
var initialContext = require('./initialcontext.js');
var attachmentserverbase = require('./attachmentserverbase.js');

var settings;
initialContext.load('attachment_settings.json', data => settings = data);

function functionthatjustpipesthings(notused) {
    return $.get('/attachment_gw/get_token/', { filename: 'asfdas' });
}

var attachmentserverpublic = {
  getThumbnail: function(attachment, scale) {
      scale || (scale = 256);
      var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";

      var attachmentlocation = attachment.get('attachmentlocation');
      return functionthatjustpipesthings(attachmentlocation).pipe(function(token) {
          return $('<img>', {src: `http://localhost:5050/loris/${attachmentlocation}/full/${scale},/0/default.jpg`, style: style});
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
          });
          return attachment;
      });
  },
  openOriginal: function(attachment) {
      var attachmentlocation = attachment.get('origfilename');
      var src = `http://localhost:5050/loris/${attachmentlocation}/full/full/0/default.jpg`;
      window.open(src);
  }
};

/*Inherit other functions from base server*/
attachmentserverpublic.prototype = attachmentserverbase;

module.exports = attachmentserverpublic;
