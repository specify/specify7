"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('q');


var schema         = require('./schema.js');
var icons          = require('./icons.js');
var specifyform    = require('./specifyform.js');
var initialContext = require('./initialcontext.js');


    // I don't think the non-sidebar items are ever used in Sp6.
    var views;
    initialContext.load(
        'app.resource?name=DataEntryTaskInit',
        data => views = _.map($('view', data), $).filter(view => view.attr('sidebar') === 'true'));

    function getFormsPromise() {
        return Q.all(views.map(
            view => specifyform.getView(view.attr('view')).pipe(form => form)));
    }

module.exports = Backbone.View.extend({
        __name__: "FormsDialog",
        className: "forms-dialog table-list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var render = this._render.bind(this);
            getFormsPromise().done(render);
            return this;
        },
        _render: function(forms) {
            this.forms = forms;
            var entries = _.map(views, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Forms",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{ text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            });
            return this;
        },
        dialogEntry: function(view) {
            var img = $('<img>', { src: icons.getIcon(view.attr('iconname')) });
            var link = $('<a>').addClass("intercept-navigation").text(view.attr('title'));
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        },
        selected: function(evt) {
            var index = this.$('a').index(evt.currentTarget);
            this.$el.dialog('close');
            var form = this.forms[index];
            var model = schema.getModel(form['class'].split('.').pop());
            this.trigger('selected', model);
        }
    });

