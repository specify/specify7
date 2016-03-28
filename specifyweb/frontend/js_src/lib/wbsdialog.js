"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema              = require('./schema.js');
var navigation          = require('./navigation.js');
var WBTemplateEditor    = require('./wbtemplateeditor.js');
var userInfo    = require('./userinfo.js');
var EditResourceDialog  = require('./editresourcedialog.js');
const uniquifyName = require('./wbuniquifyname.js');

    var NewWorkbenchDialog = Backbone.View.extend({
        __name__: "NewWorkbenchDialog",
        className: "table-list-dialog",
        events: {
            'click a': 'select'
        },
        render: function() {
            this.templates = new schema.models.WorkbenchTemplate.LazyCollection({
                filters: { specifyuser: userInfo.id, orderby: 'name' }
            });
            this.templates.fetch({ limit: 500 }).done(this.gotTemplates.bind(this));
            return this;
        },
        gotTemplates: function() {
            if (this.templates.length < 1) {
                this.newTemplate();
                return;
            }
            var entries = this.templates.map(this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Choose Dataset Template",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    { text: 'New', click: this.newTemplate.bind(this) },
                    { text: 'Cancel', click: function() { $(this).dialog('close'); } }
                ]
            });
        },
        dialogEntry: function(template) {
            var link = $('<a href="#">').text(template.get('name'));
            return $('<tr>').append(
                $('<td>').append(link)
            )[0];
        },
        newTemplate: function() {
            new WBTemplateEditor({ columns: [] })
                .render()
                .on('created', this.makeWorkbench, this);
        },
        select: function(event) {
            event.preventDefault();
            var i = this.$('a').index(event.currentTarget);
            var template = this.templates.at(i).clone();
            this.makeWorkbench(template);
        },
        makeWorkbench: function(template) {
            var workbench = new schema.models.Workbench.Resource();
            workbench.set({
                workbenchtemplate: template,
                specifyuser: template.get('specifyuser')
            });

            new EditResourceDialog({ resource: workbench })
                .render()
                .on('savecomplete',
                    () => uniquifyName(workbench.get('name'), workbench.id).done(
                        name => workbench.set('name', name).save().done(() => navigation.go('/workbench/' + workbench.id + '/'))));
        }
    });


module.exports =  Backbone.View.extend({
        __name__: "WbsDialog",
        className: "wbs-dialog table-list-dialog",
        initialize: function(options) {
            this.wbs = options.wbs.models;
        },
        render: function() {
            var entries = _.map(this.wbs, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Datasets",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    { text: 'New', click: this.newWB.bind(this) },
                    { text: 'Import', click: function() { navigation.go('/workbench-import/'); } },
                    { text: 'Cancel', click: function() { $(this).dialog('close'); } }
                ]
            });
            return this;
        },
        dialogEntry: function(wb) {
            var img = $('<img>', { src: '/images/Workbench32x32.png' });
            var href = '/workbench/' + wb.id + '/';
            var link = $('<a>', {href: href, 'class': "intercept-navigation"}).text(wb.get('name'));
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));

            _.delay(function() {
                wb.getRelatedObjectCount('workbenchrows').done(function(count) {
                    $('.item-count', entry).text('(' + count + ')').show();
                });
            }, 100);
            return entry[0];
        },
        newWB: function() {
            new NewWorkbenchDialog().render();
        }
    });

