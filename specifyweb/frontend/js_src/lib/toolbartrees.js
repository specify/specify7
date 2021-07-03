"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema = require('./schema.js');
var domain = require('./domain.js');
const commonText = require('./localization/common.tsx').default;


    var treesForAll = ['geography', 'storage', 'taxon'];
    var treesForPaleo = ['geologictimeperiod', 'lithostrat'];
    var paleoDiscs = 'paleobotany invertpaleo vertpaleo'.split(' ');

    var TreeListDialog = Backbone.View.extend({
        __name__: "TreeListDialog",
        className: "trees-dialog table-list-dialog",
        _render: function(trees) {
            var entries = _.map(trees, this.dialogEntry, this);
            var table = $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: commonText('treesDialogTitle'),
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{ text: commonText('cancel'), click: function() { $(this).dialog('close'); } }]
            });
        },
        render: function() {
            domain.getDomainResource('discipline').rget('type').pipe(function(type) {
                return treesForAll.concat(_.contains(paleoDiscs, type) ? treesForPaleo : []);
            }).done(this._render.bind(this));
            return this;
        },
        dialogEntry: function(tree) {
            var model = schema.getModel(tree);
            var img = $('<img>', { src: model.getIcon() });
            var link = $('<a>', {href: '/specify/tree/' + tree + '/'})
                    .addClass("intercept-navigation")
                    .text(model.getLocalizedName());
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        }
    });

module.exports =  {
        task: 'tree',
        title: commonText('trees'),
        icon: '/static/img/trees.png',
        execute: function() {
            new TreeListDialog().render();
        }
    };

