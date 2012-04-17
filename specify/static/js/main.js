require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui",
        'jquery-bbq': "vendor/jquery.ba-bbq",
        'underscore': "vendor/underscore",
        'backbone': "vendor/backbone",
        'beautify-html': "vendor/beautify-html",
        'text': "vendor/text",
    }
});

require([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform', 'datamodelview',
    'dataobjformatters', 'mainform', 'schemalocalization', 'beautify-html', 'jquery-bbq'
], function(
    $, _, Backbone, specifyapi, schema, specifyform, datamodelview, dataobjformat,
    MainForm, schemalocalization, beautify) {
    "use strict";

    var ResourceView = MainForm.extend({
        initialize: function(options) {
            this.specifyModel = schema.getModel(options.modelName);
            this.model = new (specifyapi.Resource.forModel(this.specifyModel))({ id: options.id });
            this.model.on('change', _.bind(this.setTitle, this));
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            return specifyform.buildViewByName(this.specifyModel.view);
        },
        setTitle: function () {
            var self = this;
            var title = self.specifyModel.getLocalizedName();
            self.setFormTitle(title);
            window.document.title = title;
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    window.document.title = title;
                }
            });
        }
    });

    var ToManyView = MainForm.extend({
        initialize: function(options) {
            this.model = options.parentResource;
            this.model.on('change', _.bind(this.setTitle, this));
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            var o = this.options;
            return specifyform.relatedObjectsForm(o.parentModel.name, o.relatedField.name, o.viewdef);
        },
        setTitle: function () {
            var self = this, o = this.options;
            var title = o.relatedField.getLocalizedName() + ' for ' + o.parentModel.getLocalizedName();
            self.setFormTitle(title);
            window.document.title = title;
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    window.document.title = title;
                }
            });
        }
    });

    var ToOneView = MainForm.extend({
        initialize: function(options) {
            options.parentResource.on('change', _.bind(this.setTitle, this));
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            var viewdef = this.options.viewdef;
            return viewdef ? specifyform.buildViewByViewDefName(viewdef) :
                specifyform.buildViewByName(this.model.specifyModel.view);
        },
        setTitle: function () {
            var self = this, o = this.options;
            var title = o.relatedField.getLocalizedName() + ' for ' + o.parentModel.getLocalizedName();
            self.setFormTitle(title);
            window.document.title = title;
            dataobjformat(o.parentResource).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    window.document.title = title;
                }
            });
        }
    });

    $(function () {
        var rootContainer = $('#content');
        var currentView;
        function setCurrentView(view) {
            currentView && currentView.remove();
            currentView = view;
            currentView.render();
            rootContainer.append(currentView.el);
        }

        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'view/:model/:id/:related/new/*splat': 'addRelated',
                'view/:model/:id/:related/*splat': 'viewRelated',
                'view/:model/:id/*splat': 'view',
                'viewashtml/*splat': 'viewashtml',
                'datamodel/:model/': 'datamodel',
                'datamodel/': 'datamodel'
            },

            view: function(modelName, id) {
                currentView && currentView.remove();
                currentView = new ResourceView({ modelName: modelName, id: id });
                currentView.render();
                rootContainer.append(currentView.el);
            },

            viewRelated: function(modelName, id, relatedField) {
                var model = schema.getModel(modelName);
                var field = model.getField(relatedField);
                var viewdef = $.deparam.querystring().viewdef;
                var opts = {
                    parentModel: model, relatedField: field, viewdef: viewdef,
                    parentResource: new (specifyapi.Resource.forModel(model))({id: id})
                };
                if (field.type === 'one-to-many') {
                    setCurrentView(new ToManyView(opts));
                } else opts.parentResource.rget(field.name).done(function(relatedResource) {
                    opts.model = relatedResource;
                    setCurrentView(new ToOneView(opts));
                });
            },

            addRelated: function(model, id, relatedField) {
                currentView && currentView.remove();
                model = schema.getModel(model);
                relatedField = model.getField(relatedField);
                function setTitle(resource) {
                    window.document.title = 'New ' + relatedField.getLocalizedName() +
                        ' for ' + model.getLocalizedName();
                    currentView.setTitle(window.document.title);
                    dataobjformat(resource).done(function(title) {
                        if(_(title).isString()) window.document.title += ': ' + title;
                        currentView.setTitle(window.document.title);
                    });
                }

                var parentResource = new (specifyapi.Resource.forModel(model))({id: id});
                parentResource.on('change', setTitle);
                parentResource.fetchIfNotPopulated();
                var relatedModel = relatedField.getRelatedModel();
                var newResource = new (specifyapi.Resource.forModel(relatedModel))();
                if (relatedField.type === 'one-to-many') {
                    newResource.set(relatedField.otherSideName, parentResource.url());
                }
                var mainForm = specifyform.buildViewByName(relatedModel.view);
                currentView = (new MainForm({ el: rootContainer, form: mainForm, model: newResource })).render();
                currentView.on('savecomplete', function() {
                    function goBack() {
                        Backbone.history.navigate(parentResource.viewUrl().replace(/^\/specify/, ''), true);
                    }
                    if (relatedField.type === 'many-to-one') {
                        parentResource.fetchIfNotPopulated().done(function() {
                            parentResource.set(relatedField.name, newResource.url());
                            parentResource.save().done(goBack);
                        });
                    } else goBack();
                });
            },

            viewashtml: function() {
                currentView && currentView.remove();
                var params = $.deparam.querystring();
                var form = params.viewdef ?
                    specifyform.buildViewByViewDefName(params.viewdef) :
                    specifyform.buildViewByName(params.view);
                if (params.localize && params.localize.toLowerCase() !== 'false')
                    schemalocalization.localizeForm(form);
                var html = $('<div>').append(form).html();
                rootContainer.empty().append(
                    $('<pre>').text(beautify.style_html(html))
                );
                currentView = null;
            },

            datamodel: function(model) {
                currentView && currentView.remove();
                var View = model ? datamodelview.DataModelView : datamodelview.SchemaView;
                currentView = new View({ model: model }).render();
                rootContainer.append(currentView.el);
            }
        });

        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});
    });
});
