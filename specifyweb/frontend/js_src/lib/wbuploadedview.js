"use strict";
const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const Q        = require('q');

const WBStatus = require('./wbstatus.js');

const template = require('./templates/wbuploaded.html');

module.exports = Backbone.View.extend({
    __name__: "WBUploadedView",
    className: "wb-uploaded",
    events: {
        'click .wb-unupload': 'unupload',
        // 'click .wb-delete': 'delete',
        // 'click .wb-export': 'export',
    },
    initialize({wb, initialStatus}) {
        this.wb = wb;
        this.initalStatus = initialStatus;
    },
    render() {
        this.$el.append(template());
        this.$('.wb-name').text(this.wb.get('name'));
        Q($.get(`/api/workbench/results/${this.wb.id}/`))
            .done(results => {
                results.forEach(result => {
                    this.$('.wb-upload-results').append(
                        $("<li>").append($("<code>").text(JSON.stringify(result)))
                    );
                });
            });

        if (this.initialStatus) this.openStatus();
    },
    unupload() {
        $.post(`/api/workbench/unupload/${this.wb.id}/`);
        this.openStatus();
    },
    openStatus() {
        new WBStatus({wb: this.wb, status: this.initialStatus}).render().on('done', () => {
            this.trigger('refresh');
        });
    }
});
