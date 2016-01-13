"use strict";

var $ = require('jquery');
var _ = require('underscore');

var api            = require('./specifyapi.js');
var UIPlugin       = require('./uiplugin.js');
var icons          = require('./icons.js');
var UIField        = require('./uifield.js');
var initialContext = require('./initialcontext.js');

    var webLinksDefs = {};
    initialContext.load('app.resource?name=WebLinks', function(xml) {
        _.each($('vector > weblinkdef', xml), function(def) {
            def = $(def);
            webLinksDefs[def.find('> name').text()] = def;
        });
    });

    var specialResourcesFields = {
        Taxon: function(resource) {
            return api.getTreePath(resource).pipe(function(path) {
                return { genus: path && path.Genus && path.Genus.name,
                         species: path && path.Species && path.Species.name };
            });
        }
    };

module.exports =   UIPlugin.extend({
        __name__: "WebLinkButton",
        render: function() {
            this.inFormTable = this.$el.hasClass('specify-field-in-table');
            var placeHolder = this.$el;
            var newEl;

            placeHolder.val() === 'plugin' && placeHolder.val('');
            this.fieldName = placeHolder.attr('name');
            var fieldInfo = this.model.specifyModel.getField(this.fieldName);
            var webLinkName = this.init.weblink == null ? fieldInfo.getWebLinkName() : this.init.weblink;
            if (webLinkName == null) console.error("couldn't determine weblink for", this.fieldName);
            this.def = webLinksDefs[webLinkName];

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
    }, { pluginsProvided: ['WebLinkButton'] });

