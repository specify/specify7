"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema = require('./schema.js');
var domain = require('./domain.js');
const icons = require('./icons.js');
const commonText = require('./localization/common').default;


    var treesForAll = ['geography', 'storage', 'taxon'];
    var treesForPaleo = ['geologictimeperiod', 'lithostrat'];
    var paleoDiscs = 'paleobotany invertpaleo vertpaleo'.split(' ');

    var TreeListDialog = Backbone.View.extend({
        __name__: "TreeListDialog",
        tagName: 'nav',
        className: "trees-dialog",
        _render: function(trees) {
          this.$el.attr('role','toolbar');
            var entries = _.map(trees, this.dialogEntry, this);
            var table = $('<ul>').css('padding',0).append(entries).appendTo(this.el);
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
            const model = schema.getModel(tree);
            return $('<li>').append(
                $('<a>', {
                    class: 'intercept-navigation',
                    href: '/specify/tree/' + tree + '/'
                })
                    .addClass("fake-link")
                    .css({fontSize: '0.8rem'})
                    .append(
                        $(
                            '<img>',
                            {
                                src: model.getIcon(),
                                width: 'var(--table-icon-size)',
                                'aria-hidden': true,
                            }
                        ),
                        model.getLocalizedName()
                    )
            )[0];
        },
    });

module.exports =  {
        task: 'tree',
        path: '/specify/tree',
        title: commonText('trees'),
        icon: '/static/img/trees.png',
        execute: function() {
            new TreeListDialog().render();
        }
    };

