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
                return { genus: path.Genus.name, species: path.Species.name };
            });
        }
    };

    return  UIPlugin.extend({
        render: function() {
            this.def = webLinksDefs[this.init.weblink];
            if (_.isUndefined(this.def)) {
                this.$el.attr('value', 'undefined weblink type: ' + this.init.weblink);
                return this;
            }
            var placeHolder = this.$el;
            this.setElement(
                placeHolder.wrap('<div class="specify-plugin-weblink">').hide().parent()
            );
            this.fieldName = placeHolder.attr('name');
            if (this.fieldName && this.fieldName !== 'this') {
                placeHolder.prop('type', 'text');
                var uiField = new UIField({ el: placeHolder, model: this.model });
                uiField.render().$el.appendTo(this.el).show();
            }

            var title = this.def.find('> desc').text();

            $('<a>', { title: title })
                .prependTo(this.el)
                .append($('<img>', { src: icons.getIcon(this.init.icon || "WebLink") }))
                .button();

            this.model.on('change', this.setLink, this);
            this.setLink();

            return this;
        },
        setLink: function() {
            var a = this.$('a');
            this.buildUrl().done(function(url) { a.attr('href', url); });
        },
        buildUrl: function() {
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
                console.log(args, template);
                return _.template(template)(args);
            });
        }
    });
});
