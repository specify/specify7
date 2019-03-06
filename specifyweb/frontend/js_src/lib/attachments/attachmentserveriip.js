"use strict";
 
var $ = require('jquery');
var _ = require('underscore');

var schema         = require('./../schema.js');
var initialContext = require('./../initialcontext.js');
var attachmentserverbase = require('./attachments.js');
var settings       = require('./../attachmentsettings.js');

function placeholder(notused) {
    return $.get('/attachment_gw/get_token/', { filename: 'asfdas' });
}

var attachmentserveriip = {
  servername: 'IIP',
   
  
  getSetting: function(key) {
        return settings[this.servername][key];
    },

  getThumbnail: function(attachment, scale) {
      scale || (scale = 256);
      var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";
      var base_url = this.getSetting('base_url');
      var attachmentLocation = attachment.get('attachmentlocation');
      return placeholder(attachmentLocation).pipe(function(token) {
          return $('<img>', {src: `${base_url}/iipsrv?IIIF=${attachmentLocation}/full/${scale},/0/default.jpg`, style: style});
      });
  },
  uploadFile: function(file, progressCB) {
      var formData = new FormData();
      var attachment;

      formData.append('file', file);

      return $.ajax({
              url: '/attachment_gw/post_to_iip/',
              type: 'POST',
              data: formData,
              processData: false,
              contentType: false,
          }).pipe(function(attachmentLocation) {
          var attachment = new schema.models.Attachment.Resource({
              attachmentlocation: attachmentLocation,
              mimetype: file.type,
              origfilename: file.name,
              ispublic: 1,
              servername: 'IIP',
          });
          return attachment;
        });
  },
  openOriginal: function(attachment) {
      var attachmentLocation = attachment.get('attachmentlocation');
      var base_url = this.getSetting('base_url');
      var src = `${base_url}/iipsrv?IIIF=${attachmentLocation}/full/full/0/default.jpg`;
      window.open(src);
  }
};

module.exports = Object.assign(Object.create(attachmentserverbase), attachmentserveriip);
