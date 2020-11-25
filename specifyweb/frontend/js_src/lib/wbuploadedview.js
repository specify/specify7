"use strict";
const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const Q        = require('q');

const template = require('./templates/wbuploaded.html');

module.exports = Backbone.View.extend({
    __name__: "WBUploadedView",
    className: "wb-uploaded",
    events: {
        'click .wb-unupload': 'unupload',
        // 'click .wb-delete': 'delete',
        // 'click .wb-export': 'export',
    },
    initialize({wb, data, uploadStatus}) {
        this.wb = wb;
        this.data = data;
        this.uploadStatus = uploadStatus;
    },
    render() {
        this.$el.append(template());
        this.$('.wb-name').text(this.wb.get('name'));
        Q($.get(`/api/workbench/upload_results/${this.wb.id}/`))
            .done(results => {
                results.forEach(result => {
                    this.$('.wb-upload-results').append(
                        $("<li>").append($("<code>").text(JSON.stringify(result)))
                    );
                });
            });
    },
    unupload() {
        $.post(`/api/workbench/unupload/${this.wb.id}/`);
    }
});
