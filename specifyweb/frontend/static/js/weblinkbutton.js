define([
    'jquery', 'underscore', 'specifyapi', 'uiplugin', 'icons', 'uifield',
    'text!context/app.resource?name=WebLinks!noinline'
], function($, _, api, UIPlugin, icons, UIField, webLinksXML) {
    "use strict";

    var webLinksDefs = {};

    _.each($('vector > weblinkdef', $.parseXML(webLinksXML)), function(def) {
        def = $(def);
        webLinksDefs[def.find('> name').text()] = def;
    });

    var specialResourcesFields = {
        Taxon: function(resource) {
            return api.getTreePath(resource).pipe(function(path) {
                return { genus: path && path.Genus.name, species: path && path.Species.name };
            });
        }
    };

    return  UIPlugin.extend({
        __name__: "WebLinkButton",
        render: function() {
            this.def = webLinksDefs[this.init.weblink];
            this.inFormTable = this.$el.hasClass('specify-field-in-table');
            var placeHolder = this.$el;
            var newEl;

            placeHolder.val() === 'plugin' && placeHolder.val('');
            this.fieldName = placeHolder.attr('name');
            if (this.inFormTable) {
                newEl = $('<div class="specify-plugin-weblink-in-table">').append('<a>');
                placeHolder.replaceWith(newEl);
                this.setElement(newEl);
            } else {
                newEl = placeHolder.wrap('<div class="specify-plugin-weblink">').hide().parent();
                this.setElement(newEl);

                if (this.fieldName && this.fieldName !== 'this') {
                    placeHolder.prop('type', 'text');
                    var uiField = new UIField({ el: placeHolder, model: this.model });
                    uiField.render().$el.appendTo(this.el).show();
                }

                var title = this.def && this.def.find('> desc').text();

                $('<a>', { title: title })
                    .prependTo(this.el)
                    .append($('<img>', { src: icons.getIcon(this.init.icon || "WebLink") }))
                    .button();
            }

            this.model.on('change', this.setLink, this);
            this.setLink();

            return this;
        },
        setLink: function() {
            var a = this.$('a');
            var inFormTable = this.inFormTable;
            this.buildUrl().done(function(url) {
                a.attr('href', url);
                inFormTable && !this.def && a.text(url || '');
           });
        },
        buildUrl: function() {
            if (!this.def) return this.model.rget(this.fieldName);

            var template = this.def.find('baseURLStr').text()
                    .replace(/<\s*this\s*>/g, '<_this>')
                    .replace(/AMP/g, '&')
                    .replace(/</g, '<%= ')
                    .replace(/>/g, ' %>');

            var args = {};
            _.each(this.def.find('weblinkdefarg > name'),function(argName) {
                argName = $(argName).text();
                (argName === 'this') && (argName = '_this');
                args[argName] = null;
            });

            var getSpecialFields =
                    specialResourcesFields[this.model.specifyModel.name] ||
                    function() { return $.when({}); };

            var data = this.model.toJSON();
            _.extend(args, data, { _this: data[this.fieldName] });

            return getSpecialFields(this.model).pipe(function(specialFields) {
                _.extend(args, specialFields);
                return _.template(template)(args);
            });
        }
    });
});
