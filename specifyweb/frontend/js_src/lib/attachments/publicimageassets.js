"use strict";

var $ = require('jquery');
var _ = require('underscore');

var schema         = require('./../schema.js');
var initialContext = require('./../initialcontext.js');
var attachmentserverbase = require('./attachments.js');
var settings       = require('./../attachmentsettings.js');


function placeholderforlorisauthentication(notused) {
    return $.get('/attachment_gw/get_token/', { filename: 'asfdas' });
}

function getHmacPOST(file) {
    var formData = new FormData();
    formData.append('file', file);

    return $.ajax({
        url: '/attachment_gw/post_to_pia/',
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        async: false,
    });
}

var publicimageassets = {
  servername: 'PIA',
  getThumbnail: function(attachment, scale) {
      scale || (scale = 256);
      var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";
      var base_url = this.getSetting('base_url');
      var attachmentLocation = attachment.get('attachmentlocation');
      return placeholderforlorisauthentication(attachmentLocation).pipe(function(token) {
          return $('<img>', {src: `${base_url}/${attachmentLocation}/thumbnail?scale=${scale}`, style: style});
      });
  },
  uploadFile: function(file, progressCB) {
      var formData = new FormData();
      var attachment;

      formData.append('file', file);

      return $.ajax({
              url: '/attachment_gw/post_to_pia/',
              type: 'POST',
              data: formData,
              processData: false,
              contentType: false,
          }).pipe(function(response) {
          console.log(this.servername);
          var attachment = new schema.models.Attachment.Resource({
              attachmentlocation: response.attachmentlocation,
              capturedevice: response.capturedevice,
              copyrightholder: response.copyrightholder,
              dateimaged: response.dateimaged,
              filecreateddate: response.filecreateddate,
              mimetype: response.mimetype,
              origfilename: file.name,
              ispublic: 1,
              attachmentstorageconfig: 'PIA'
          });
          return attachment;
        });
  },
  openOriginal: function(attachment) {
      var attachmentLocation = attachment.get('attachmentlocation');
      var base_url = this.getSetting('base_url');
      var src = `${base_url}/${attachmentLocation}/fullsize`;
      window.open(src);
  }
};

module.exports = Object.assign(Object.create(attachmentserverbase), publicimageassets);
