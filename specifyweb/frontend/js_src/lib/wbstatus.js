"use strict";

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');

const statusTemplate = require('./templates/wbstatus.html');

const refreshTime = 2000;

module.exports = Backbone.View.extend({
    __name__: "WBStatus",
    className: "wb-status",
    initialize({wb, status}) {
        this.wb = wb;
        this.status = status;
        this.stopStatusRefresh = false;
    },
    render() {
        const stopRefresh = () => this.stopStatusRefresh = true;

        this.$el.append(statusTemplate(this.status)).dialog({
            modal: true,
            title: "Workbench Status",
            open(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close() { $(this).remove(); stopRefresh(); },
            buttons: [{text: 'Abort', click: () => { $.post(`/api/workbench/abort/${this.wb.id}/`); }}]
        });

        if(this.status)
            this.initializeProgressBar();

        window.setTimeout(() => this.refresh(), refreshTime);

        return this;
    },
    refresh() {
        $.get(`/api/workbench/status/${this.wb.id}/`).done(
            status => {
                this.status = status;

                if (this.stopStatusRefresh) {
                    return;
                } else {
                    window.setTimeout(() => this.refresh(), refreshTime);
                }

                if (status == null) {
                    this.trigger('done');
                    this.stopStatusRefresh = true;
                    this.$el.dialog('close');
                } else {
                    this.$el.empty().append(statusTemplate({status: status}));
                    this.initializeProgressBar();
                }
            });
    },
    initializeProgressBar(){
        const {total:max, current:value} = this.status[2];
        const progress_bar = this.$el.find('.wb-status-progress-bar');

        if(progress_bar.length !== 0)
            progress_bar.progressbar({
            value: value,
            max: max
        });
    }
});
