define([
    'jquery', 'underscore', 'uiplugin', 'icons', 'uifield',
    'text!context/app.resource?name=WebLinks!noinline'
], function($, _, UIPlugin, icons, UIField, webLinksXML) {
    "use strict";

    var webLinksDefs = {};

    _.each($('vector > weblinkdef', $.parseXML(webLinksXML)), function(def) {
        def = $(def);
        webLinksDefs[def.find('> name').text()] = def;
    });

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

            var button = $('<a>', { href: this.buildUrl(), title: title }).prependTo(this.el);
            button.append($('<img>', { src: icons.getIcon(this.init.icon || "WebLink") }));
            this.$('a').button();
            this.$el.prop('disabled', false);
            return this;
        },
        buildUrl: function() {
            var args = {};
            _.each(this.def.find('weblinkdefarg > name'),function(argName) {
                argName = $(argName).text();
                (argName === 'this') && (argName = '_this');
                args[argName] = null;
            });

            var data = this.model.toJSON();
            _.extend(args, data, { _this: data[this.fieldName] });

            var template = this.def.find('baseURLStr').text()
                    .replace(/<\s*this\s*>/g, '<_this>')
                    .replace(/AMP/g, '&')
                    .replace(/</g, '<%= ')
                    .replace(/>/g, ' %>');

            console.log(args, template);
            return _.template(template)(args);
        }
    });
});
