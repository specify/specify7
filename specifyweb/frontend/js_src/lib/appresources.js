"use strict";
require('../css/appresources.css');

const $ = require('jquery');
const Q = require('q');
const Backbone = require('./backbone.js');
const _ = require('underscore');
const ace = require('brace');
require('brace/mode/xml');
require('brace/mode/properties');

const app = require('./specifyapp.js');
const schema = require('./schema.js');
const SaveButton = require('./savebutton.js');
const DeleteButton = require('./deletebutton.js');
const userInfo = require('./userinfo.js');
const navigation = require('./navigation.js');
const newResourceTmpl = require('./templates/newappresource.html');

function makeUrl(resource) {
    return {
        SpAppResource: `/specify/appresources/${resource.id}/`,
        SpViewSetObj:  `/specify/viewsets/${resource.id}/`
    }[resource.specifyModel.name];
}

function fileExtFor(resource) {
    if (resource.specifyModel.name === 'SpViewSetObj') {
        return ".xml";
    }
    const mimetype = resource.get('mimetype');
    if (/^jrxml/.test(mimetype)) return '.jrxml';
    if (mimetype === 'text/xml') return '.xml';
    if (resource.get('name') === 'preferences') return '.properties';
    return "";
}

const AppResourcePage = Backbone.View.extend({
    __name__: "AppresourcePage",
    id: "appresource-page",
    initialize({resources, selectedId}) {
        this.selectedId = selectedId;
        this.resources = resources;
    },
    render() {
        const selected = this.resources.filter(r => r.id === this.selectedId)[0];
        new AppResourcesView(Object.assign({selectedResource: selected}, this.options)).render().$el.appendTo(this.el);

        if (this.selectedId != null) {
            if (selected != null) {
                new ResourceDataView({model: selected}).render().$el.appendTo(this.el);
            } else {
                $(`<p style="margin:auto">${this.options.ResourceModel.getLocalizedName()} not found.</p>`).appendTo(this.el);
            }
        }
        return this;
    }
});

function modeForResource(appResource) {
    if (appResource.specifyModel.name == 'SpViewSetObj') {
        return "ace/mode/xml";
    }
    if (appResource.get('mimetype') == null && appResource.get('name') === 'preferences') {
        return "ace/mode/properties";
    }
    if (appResource.get('mimetype') === 'text/xml') {
        return "ace/mode/xml";
    }
    if (appResource.get('mimetype') === 'jrxml/label') {
        return "ace/mode/xml";
    }
    if (appResource.get('mimetype') === 'jrxml/report') {
        return "ace/mode/xml";
    }
    return null;
}

const ResourceDataView = Backbone.View.extend({
    __name__: "AppResourceDataView",
    className: "appresource-data",
    events: {
        'click .load-file': 'loadFile',
        'change input': 'metadataChanged',
    },
    render() {
        if (this.model == null) {
            this.$el.empty();
            return this;
        }

        this.model.rget('spappresourcedatas', true).done(sards => {
            const buttonsDiv = $('<div class="specify-form-buttons">');
            this.appresourceData = sards.first();

            if (this.appresourceData) {
                $('<h2 class="specify-form-header">').append(
                    $('<span class="view-title">').text(this.model.get('name'))
                ).appendTo(this.el);

                $('<label class="metadata-input">Metadata: <input type="text" spellcheck="false"/><label>').appendTo(this.el);
                $('.metadata-input input', this.el).val(this.model.get('metadata'));

                if (this.model.specifyModel.name === 'SpAppResource') {
                    $('<label class="mimetype-input">Mimetype: <input type="text" spellcheck="false"/><label>').appendTo(this.el);
                    $('.mimetype-input input', this.el).val(this.model.get('mimetype'));
                }

                if (userInfo.isadmin) {
                    this.$el.append('<a class="load-file">Load File</a>');
                }

                const blob = new Blob([this.appresourceData.get('data')], {type: this.model.get('mimetype') || ""});
                const url = (window.URL || window.webkitURL).createObjectURL(blob);
                $('<a class="download-resource">Download</a>').attr({
                    href: url,
                    download: this.model.get('name') + fileExtFor(this.model)
                }).appendTo(this.el);

                const editArea = $('<div class="resource-editor">').appendTo(this.el);
                var editor = ace.edit(editArea[0], {
                    readOnly: !userInfo.isadmin,
                });
                editor.getSession().setMode(modeForResource(this.model));
                editor.setValue(this.appresourceData.get('data'));
                editor.setPrintMarginColumn(null);
                editor.clearSelection();
                editor.on("change", () => {
                    this.appresourceData.set('data', editor.getValue(), {changedBy: editor});
                });

                this.appresourceData.on('change:data', (resource, value, options) => {
                    if (options.changedBy != editor) {
                        editor.setValue(this.appresourceData.get('data'));
                        editor.clearSelection();
                    }
                });

                userInfo.isadmin && buttonsDiv.append(
                    new SaveButton({model: this.appresourceData})
                        .on('savecomplete', () => this.model.save()) // so the save button does both
                        .render().el
                );
            } else {
                $('<p>This app resource appears to be corrupt but may be in the process of being saved by another '
                  + 'session. It can be deleted if that is not the case.</p>').appendTo(this.el);
            }

            userInfo.isadmin &&  buttonsDiv.append(
                new DeleteButton({model: this.model}).render()
                    .on('deleted', () => navigation.go('/specify/appresources/'))
                    .el
            );

            this.$el.append(buttonsDiv);
        });

        return this;
    },
    metadataChanged() {
        this.model.set('mimetype', $('.mimetype-input input', this.el).val());
        this.model.set('metadata', $('.metadata-input input', this.el).val());
        this.appresourceData.trigger('saverequired'); // this is bad.
    },
    loadFile() {
        const fileInput = $('<input type="file">');
        const dialog = $('<div><p>Select the file to be loaded into the editor.</p></div>').append(fileInput).dialog({
            modal: true,
            title: "Load file",
            close: function() { $(this).remove(); },
            buttons: { Cancel() { $(this).dialog('close'); } }
        });
        fileInput.on('change', () => {
            const file = fileInput[0].files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => this.appresourceData.set('data', e.target.result);
                reader.readAsText(file);
                dialog.dialog('close');
            }
        });
    }
});

const ResourceView = Backbone.View.extend({
    __name__: "AppResourceView",
    className: 'appresource-name',
    tagName: 'li',
    initialize({selectedResource}) {
        this.isSelected = this.model === selectedResource;
    },
    render() {
        this.$el.append(
            $('<a>', {
                href: makeUrl(this.model),
                text: this.model.get('name'),
                'class': 'intercept-navigation'
            })
        ).addClass(this.isSelected ? 'selected' : '');
        return this;
    }
});

const ResourceList = Backbone.View.extend({
    __name__: "ResourceListView",
    tagName: 'ul',
    events: {
        'click .new-resource': 'openNameDialog'
    },
    initialize({resources, getDirectory, selectedResource, ResourceModel}) {
        this.resources = resources;
        this.getDirectory = getDirectory;
        this.selectedResource = selectedResource;
        this.ResourceModel = ResourceModel;
        this.views = _(resources).sortBy(r => r.get('name').toLowerCase())
            .map(r => new ResourceView({model: r, selectedResource: this.selectedResource}));
        this.containsSelected = this.views.some(v => v.isSelected);
    },
    render() {
        this.$el.append(
            this.views.map(v => v.render().el)
        );
        if (userInfo.isadmin) {
            this.$el.append(`<li class="new-resource">New ${this.ResourceModel.getLocalizedName()}</li>`);
        }
        return this;
    },
    createResource(name) {
        this.getDirectory().then(directory => {
            const resource = new this.ResourceModel.Resource({
                level: 0, // wtf is this for?
                name: name,
                specifyuser: userInfo.resource_uri,
                spappresourcedir: directory.get('resource_uri')
            });
            return Q(resource.save()).then(() => resource);
        }).then(resource => {
            const resourceFieldName = this.ResourceModel.getField('spappresourcedatas').getReverse().name;
            const resourceData = new schema.models.SpAppResourceData.Resource({data: ""});
            resourceData.set(resourceFieldName, resource.get('resource_uri'));
            return Q(resourceData.save()).then(() => resource);
        }).done(resource => {
            navigation.go(makeUrl(resource));
        });
    },
    openNameDialog() {
        const thisCreateResource = name => this.createResource(name);

        const createResource = function(evt) {
            evt.preventDefault();
            dialog.dialog('close');
            thisCreateResource( $('input', this).val() );
        };

        const dialog = $(newResourceTmpl()).dialog({
            modal: true,
            close: function() { $(this).remove(); },
            buttons: [
                {text: 'Create', click: createResource},
                {text: 'Cancel', click: function() { $(this).dialog('close'); }}
            ]});
        $('input', dialog).focus();
        $('form', dialog).submit(createResource);
    }
});

const AppResourcesView = Backbone.View.extend({
    __name__: "AppResourcesView",
    id: 'appresources-view',
    events: {
        'click .toggle-content': 'toggle'
    },
    render() {
        this.$el.append(
            $('<h2>').text(this.options.ResourceModel.getLocalizedName()),
            new GlobalResourcesView(this.options).render().el,
            new DisciplinesView(this.options).render().el
        );
        return this;
    },
    toggle(evt) {
        const toToggle = $(evt.currentTarget).next();
        setStoredToggleState(this.options.ResourceModel, $(evt.currentTarget).data('appdir'), !toToggle.is(":visible"));
        toToggle.slideToggle();
    }
});

function getStoredToggleState(resourceModel, levelKey) {
    const key = `AppResource.visibleDirs.${resourceModel.name}.${userInfo.id}`;
    const toggleStates = JSON.parse(window.localStorage.getItem(key) || "{}");
    return !!toggleStates[levelKey];
}

function setStoredToggleState(resourceModel, levelKey, state) {
    const key = `AppResource.visibleDirs.${resourceModel.name}.${userInfo.id}`;
    const toggleStates = JSON.parse(window.localStorage.getItem(key) || "{}");
    toggleStates[levelKey] = state;
    window.localStorage.setItem(key, JSON.stringify(toggleStates));
}

const GlobalResourcesView = Backbone.View.extend({
    __name__: "GlobalResourcesView",
    initialize({directories, resources, selectedResource, ResourceModel}) {
        // there are multiple "global" directories
        // distinguished by the usertype field
        // i'm not going to bother separating them out for now
        const globalDirs = directories
                  .filter(d => d.get('discipline') == null);

        const dirURIs = globalDirs.map(d => d.get('resource_uri'));

        // all new resources will be added to the common directory
        // because, why not?
        const commonDir = globalDirs.filter(d => d.get('usertype') === 'Common')[0];

        this.resourceList = new ResourceList({
            resources: resources.filter(r => dirURIs.includes(r.get('spappresourcedir'))),
            selectedResource: selectedResource,
            getDirectory: () => Q(commonDir),
            ResourceModel: ResourceModel
        });
    },
    render() {
        this.$el.append(
            `<h3 class="toggle-content" data-appdir="global">Global <small>(${this.resourceList.resources.length})</small></h3>`,
            this.resourceList.render().$el
                .toggle(this.resourceList.containsSelected || getStoredToggleState(this.options.ResourceModel, 'global'))
        );
        return this;
    },
    getDirectory() {
        let directory = this.directories[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: false,
            discipline: this.discipline.get('resource_uri')
        }, {noBusinessRules: true});
        directory.set('collection', null); // The collection gets set automatically by the 'newresource' event on the api.
        return Q(directory.save()).then(() => directory);
    }
});

const DisciplinesView = Backbone.View.extend({
    __name__: "DisciplineView",
    initialize({users, disciplines, directories, collections, resources, selectedResource, ResourceModel}) {
        this.views = disciplines.map(
            disc => new DisciplineResourcesView({
                discipline: disc,
                users: users,
                directories: directories,
                collections: collections,
                resources: resources,
                selectedResource: selectedResource,
                ResourceModel: ResourceModel
            })
        );

        this.containsSelected = this.views.some(v => v.containsSelected);
        this.count = this.views.reduce((a, v) => a + v.count, 0);
    },
    render() {
        this.$el.append(
            `<h3 class="toggle-content" data-appdir="disciplines">Disciplines <small>(${this.count})</small></h3>`,
            $('<div>').append(this.views.map(v => v.render().el))
                .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'disciplines'))
        );
        return this;
    }
});

const DisciplineResourcesView = Backbone.View.extend({
    __name__: "DisciplineResourcesView",
    initialize({discipline, users, directories, collections, resources, selectedResource, ResourceModel}) {
        this.discipline = discipline;
        this.collections = collections.filter(col => col.get('discipline') === discipline.get('resource_uri'));

        this.directories = directories
            .filter(dir => dir.get('discipline') === discipline.get('resource_uri') && dir.get('collection') == null);

        const dirs = this.directories.map(dir => dir.get('resource_uri'));
        this.resources = resources.filter(r => dirs.includes(r.get('spappresourcedir')));

        this.resourceList = new ResourceList({
            resources: this.resources,
            getDirectory: () => this.getDirectory(),
            selectedResource: selectedResource,
            ResourceModel: ResourceModel
        });

        this.collectionViews = this.collections.map(
            col => new CollectionResourcesView({
                collection: col,
                discipline: discipline,
                users: users,
                directories: directories,
                resources: resources,
                selectedResource: selectedResource,
                ResourceModel: ResourceModel
            })
        );

        this.containsSelected = this.resourceList.containsSelected ||
            this.collectionViews.some(v => v.containsSelected);

        this.count = this.resources.length + this.collectionViews.reduce((a, v) => a + v.count, 0);
    },
    render() {
        this.$el.append(
            $('<h3 class="toggle-content">')
                .data('appdir', this.discipline.get('resource_uri'))
                .text(this.discipline.get('name'))
                .append(` <small>(${this.count})</small>`),
            $('<div>').append(
                this.resourceList.render().el,
                this.collectionViews.map(v => v.render().el)
            ).toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, this.discipline.get('resource_uri')))
        );
        return this;
    },
    getDirectory() {
        let directory = this.directories[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: false,
            discipline: this.discipline.get('resource_uri')
        }, {noBusinessRules: true});
        directory.set('collection', null); // The collection gets set automatically by the 'newresource' event on the api.
        return Q(directory.save()).then(() => directory);
    }
});

const CollectionResourcesView = Backbone.View.extend({
    __name__: "CollectionResourcesView",
    initialize({users, discipline, collection, directories, resources, selectedResource, ResourceModel}) {
        this.discipline = discipline;
        this.collection = collection;

        this.directories = directories
            .filter(dir => dir.get('collection') === collection.get('resource_uri') && dir.get('usertype') == null);

        const dirs = this.directories.map(dir => dir.get('resource_uri'));
        this.resources = resources.filter(r => dirs.includes(r.get('spappresourcedir')));

        this.resourceList = new ResourceList({
            resources: this.resources,
            getDirectory: () => this.getDirectory(),
            selectedResource: selectedResource,
            ResourceModel: ResourceModel
        });

        this.userTypeView = new UserTypeView({
            discipline: discipline,
            collection: collection,
            directories: directories,
            resources: resources,
            selectedResource: selectedResource,
            ResourceModel: ResourceModel
        });

        this.userView = new UserView({
            users: users,
            discipline: discipline,
            collection: collection,
            directories: directories,
            resources: resources,
            selectedResource: selectedResource,
            ResourceModel: ResourceModel
        });

        this.containsSelected = this.resourceList.containsSelected ||
            this.userTypeView.containsSelected ||
            this.userView.containsSelected;

        this.count = this.resources.length + this.userTypeView.count + this.userView.count;
    },
    render() {
        this.$el.append(
            $('<h4 class="toggle-content">')
                .data('appdir', this.collection.get('resource_uri'))
                .text(this.collection.get('collectionname'))
                .append(` <small>(${this.count})</small>`),
            $('<div>').append(
                this.resourceList.render().el,
                $('<h5 class="toggle-content" data-appdir="usertypes">')
                    .text('User Types')
                    .append(` <small>(${this.userTypeView.count})</small>`),
                this.userTypeView.render().el,
                $('<h5 class="toggle-content" data-appdir="users">')
                    .text('Users')
                    .append(` <small>(${this.userView.count})</small>`),
                this.userView.render().el
            ).toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, this.collection.get('resource_uri')))
        );
        return this;
    },
    getDirectory() {
        let directory = this.directories[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: false,
            discipline: this.discipline.get('resource_uri'),
            collection: this.collection.get('resource_uri')
        }, {noBusinessRules: true});
        return Q(directory.save()).then(() => directory);
    }
});

const UserTypeView = Backbone.View.extend({
    __name__: "UserTypeView",
    initialize({discipline, collection, directories, resources, selectedResource, ResourceModel}) {

        this.views = ["Manager", "FullAccess", "LimitedAccess", "Guest"].map(
            t => new UserTypeResourcesView({
                type: t,
                discipline: discipline,
                collection: collection,
                directories: directories,
                resources: resources,
                selectedResource: selectedResource,
                ResourceModel: ResourceModel
            })
        );

        this.containsSelected = this.views.some(v => v.containsSelected);
        this.count = this.views.reduce((a, v) => a + v.count, 0);
    },
    render() {
        this.$el.append(this.views.map(v => v.render().el))
            .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'usertypes'));
        return this;
    }
});

const UserTypeResourcesView = Backbone.View.extend({
    __name__: "UserTypeResourcesView",
    initialize({discipline, collection, directories, type, resources, selectedResource, ResourceModel}) {
        this.discipline = discipline;
        this.collection = collection;
        this.usertype = type;

         this.directories = directories
                  .filter(dir =>
                          dir.get('collection') === collection.get('resource_uri') &&
                          dir.get('usertype') === type.toLowerCase() &&
                          !dir.get('ispersonal'));

        const dirs = this.directories.map(dir => dir.get('resource_uri'));
        this.resources = resources.filter(r => dirs.includes(r.get('spappresourcedir')));

        this.resourceList = new ResourceList({
            resources: this.resources,
            getDirectory: () => this.getDirectory(),
            selectedResource: selectedResource,
            ResourceModel: ResourceModel
        });

        this.containsSelected = this.resourceList.containsSelected;
        this.count = this.resources.length;
    },
    render() {
        this.$el.append(
            $('<h4 class="toggle-content">')
                .data('appdir', 'usertype-' + this.usertype)
                .text(this.usertype)
                .append(` <small>(${this.count})</small>`),
            this.resourceList.render().$el
                .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'usertype-' + this.usertype))
        );
        return this;
    },
    getDirectory() {
        let directory = this.directories[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: false,
            discipline: this.discipline.get('resource_uri'),
            collection: this.collection.get('resource_uri'),
            usertype: this.usertype.toLowerCase()
        }, {noBusinessRules: true});
        return Q(directory.save()).then(() => directory);
    }
});

const UserView = Backbone.View.extend({
    __name__: "UserView",
    initialize({discipline, collection, users, directories, resources, selectedResource, ResourceModel}) {

        this.views = users.map(
            user => new UserResourcesView({
                user: user,
                discipline: discipline,
                collection: collection,
                directories: directories,
                resources: resources,
                selectedResource: selectedResource,
                ResourceModel: ResourceModel
            })
        );

        this.containsSelected = this.views.some(v => v.containsSelected);
        this.count = this.views.reduce((a, v) => a + v.count, 0);
    },
    render() {
        this.$el.append(this.views.map(v => v.render().el))
            .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'users'));
        return this;
    }
});


const UserResourcesView = Backbone.View.extend({
    __name__: "UserResourcesView",
    initialize({discipline, collection, directories, user, resources, selectedResource, ResourceModel}) {
        this.discipline = discipline;
        this.collection = collection;
        this.user = user;

        this.directories = directories.filter(
            dir => dir.get('collection') === collection.get('resource_uri') &&
                dir.get('specifyuser') === user.get('resource_uri') &&
                dir.get('ispersonal')
        );

        const dirs = this.directories.map(dir => dir.get('resource_uri'));
        this.resources = resources.filter(r => dirs.includes(r.get('spappresourcedir')));

        this.resourceList = new ResourceList({
            resources: this.resources,
            getDirectory: () => this.getDirectory(),
            selectedResource: selectedResource,
            ResourceModel: ResourceModel
        });

        this.containsSelected = this.resourceList.containsSelected;
        this.count = this.resources.length;
    },
    render() {
        this.$el.append(
            $('<h4 class="toggle-content">')
                .data('appdir', this.user.get('resource_uri'))
                .text(this.user.get('name'))
                .append(` <small>(${this.count})</small>`),
            this.resourceList.render().$el
                .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, this.user.get('resource_uri')))
        );
        return this;
    },
    getDirectory() {
        let directory = this.directories[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: true,
            discipline: this.discipline.get('resource_uri'),
            collection: this.collection.get('resource_uri'),
            usertype: this.user.get('usertype').toLowerCase(),
            specifyuser: this.user.get('resource_uri')
        }, {noBusinessRules: true});
        return Q(directory.save()).then(() => directory);
    }
});

function appResourcesTask(ResourceModel, id) {
    app.setTitle(ResourceModel.getLocalizedName());

    const resourceDirs = new schema.models.SpAppResourceDir.LazyCollection();
    const disciplines = new schema.models.Discipline.LazyCollection();
    const collections = new schema.models.Collection.LazyCollection();
    const resources = new ResourceModel.LazyCollection();
    const users = new schema.models.SpecifyUser.LazyCollection();

    Q.all([
        resourceDirs.fetch({limit: 0}),
        disciplines.fetch({limit: 0}),
        collections.fetch({limit: 0}),
        resources.fetch({limit: 0}),
        users.fetch({limit: 0}),
    ]).done(() => {
        app.setCurrentView(new AppResourcePage({
            selectedId: id,
            directories: resourceDirs,
            disciplines: disciplines,
            collections: collections,
            resources: resources,
            users: users,
            ResourceModel: ResourceModel
        }));
    });
 }

module.exports = {
    appResources: id => appResourcesTask(schema.models.SpAppResource, id),
    viewSets: id => appResourcesTask(schema.models.SpViewSetObj, id)
};
