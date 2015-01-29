define([
    'jquery', 'underscore', 'backbone', 'schema',
    'icons', 'specifyform', 'whenall',
    'text!context/app.resource?name=DataEntryTaskInit!noinline',
    'jquery-ui'
], function($, _, Backbone, schema, icons, specifyform,
            whenAll, dataEntryTaskInit) {
    "use strict";

    var views = _.map($('view', dataEntryTaskInit), $);

    var formsPromise = whenAll(_.map(views, function(view) {
        return specifyform.getView(view.attr('view')).pipe(function(form) { return form; });
    }));

    return Backbone.View.extend({
        __name__: "FormsDialog",
        className: "forms-dialog table-list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var render = this._render.bind(this);
            formsPromise.done(render);
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
});
