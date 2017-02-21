"use strict";
require('../css/appresources.css');

const $ = require('jquery');
const Q = require('q');
const Backbone = require('./backbone.js');
const _ = require('underscore');

const app = require('./specifyapp.js');
const schema = require('./schema.js');
const SaveButton = require('./savebutton.js');
const DeleteButton = require('./deletebutton.js');
const userInfo = require('./userinfo.js');
const navigation = require('./navigation.js');

function makeUrl(resource) {
    return {
        SpAppResource: `/specify/appresources/${resource.id}/`,
        SpViewSetObj:  `/specify/viewsets/${resource.id}/`
    }[resource.specifyModel.name];
}

const AppResourcePage = Backbone.View.extend({
    __name__: "AppresourcePage",
    id: "appresource-page",
    initialize({resources, selectedId}) {
        this.selected = resources.filter(r => r.id === selectedId)[0];
    },
    render() {
        new AppResourcesView(Object.assign({selectedResource: this.selected}, this.options)).render().$el.appendTo(this.el);
        if (this.selected != null) {
            new ResourceDataView({model: this.selected}).render().$el.appendTo(this.el);
        }
        return this;
    }
});

const ResourceDataView = Backbone.View.extend({
    __name__: "AppResourceDataView",
    className: "appresource-data",
    events: {
        'keyup textarea': 'dataChanged'
    },
    render() {
        if (this.model == null) {
            this.$el.empty();
            return this;
        }

        this.$el.append('<textarea spellcheck=false>');

        this.model.rget('spappresourcedatas', true).done(sards => {
            this.appresourceData = sards.first();
            this.$('textarea')
                .text(this.appresourceData.get('data'))
                .attr('readonly', !userInfo.isadmin);

            userInfo.isadmin && this.$el.append(
                new SaveButton({model: this.appresourceData}).render().el,
                new DeleteButton({model: this.model}).render()
                    .on('deleted', () => navigation.go('/specify/appresources/'))
                    .el
            );
        });

        return this;
    },
    dataChanged() {
        this.appresourceData.set('data', this.$('textarea').val());
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
    initialize({resources, getDirectory, selectedResource, canAddResource = true, ResourceModel}) {
        this.resources = resources;
        this.getDirectory = getDirectory;
        this.selectedResource = selectedResource;
        this.canAddResource = canAddResource;
        this.ResourceModel = ResourceModel;
        this.views = _(resources).sortBy(r => r.get('name').toLowerCase())
            .map(r => new ResourceView({model: r, selectedResource: this.selectedResource}));
        this.containsSelected = this.views.some(v => v.isSelected);
    },
    render() {
        this.$el.append(
            this.views.map(v => v.render().el)
        );
        if (this.canAddResource && userInfo.isadmin) {
            this.$el.append('<li class="new-resource">New Resource</li>');
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
            const resourceData = new schema.models.SpAppResourceData.Resource({
                spappresource: resource.get('resource_uri'),
                data: ""
            });
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

        const dialog = $('<div title="New Resource Name">\n' +
                         '<form>\n' +
                         '<label>New Resource Name:</label>\n' +
                         '<input type="text">\n' +
                         '<input type="submit" style="display: none;">\n' +
                         '</form>\n' +
                         '</div>').dialog({
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
            '<h2>Specify Application Resources</h2>',
            new GlobalResourcesView(this.options).render().el,
            $('<div>').append(
                '<h3 class="toggle-content">Disciplines</h3>',
                new DisciplinesView(this.options).render().el
            )
        );
        return this;
    },
    toggle(evt) {
        $(evt.currentTarget).next().slideToggle();
    }
});

const GlobalResourcesView = Backbone.View.extend({
    __name__: "GlobalResourcesView",
    initialize({directories, resources, selectedResource, ResourceModel}) {
        // there are multiple "global" directories
        // distinguished by the usertype field
        // i'm not going to bother separating them out for now
        const globalDirs = directories
                  .filter(d => d.get('discipline') == null)
                  .map(d => d.get('resource_uri'));

        this.resourceList = new ResourceList({
            resources: resources.filter(r => globalDirs.includes(r.get('spappresourcedir'))),
            selectedResource: selectedResource,
            canAddResource: false, // because there are multiple dirs it could go into
            ResourceModel: ResourceModel
        });
    },
    render() {
        this.$el.append(
            '<h3 class="toggle-content">Global Resources</h3>',
            this.resourceList.render().$el.toggle(this.resourceList.containsSelected)
        );
        return this;
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
    },
    render() {
        this.$el.append(
            this.views.map(v => v.render().el)
        ).toggle(this.containsSelected);
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
    },
    render() {
        this.$el.append(
            $('<h3 class="toggle-content">').text(this.discipline.get('name')),
            $('<div>').append(
                this.resourceList.render().el,
                this.collectionViews.map(v => v.render().el)
            ).toggle(this.containsSelected)
        );
        return this;
    },
    getDirectory() {
        let directory = this.directories[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: false,
            discipline: this.discipline.get('resource_uri')
        });
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
    },
    render() {
        this.$el.append(
            $('<h4 class="toggle-content">').text(this.collection.get('collectionname')),
            $('<div>').append(
                this.resourceList.render().el,
                $('<h5 class="toggle-content">').text("User Types"),
                this.userTypeView.render().el,
                $('<h5 class="toggle-content">').text("Users"),
                this.userView.render().el
            ).toggle(this.containsSelected)
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
        });
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
    },
    render() {
        this.$el.append(this.views.map(v => v.render().el)).toggle(this.containsSelected);
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
    },
    render() {
        this.$el.append(
            $('<h4 class="toggle-content">').text(this.usertype),
            this.resourceList.render().$el.toggle(this.containsSelected)
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
        });
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
    },
    render() {
        this.$el.append(this.views.map(v => v.render().el)).toggle(this.containsSelected);
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
    },
    render() {
        this.$el.append(
            $('<h4 class="toggle-content">').text(this.user.get('name')),
            this.resourceList.render().$el.toggle(this.containsSelected)
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
        });
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
