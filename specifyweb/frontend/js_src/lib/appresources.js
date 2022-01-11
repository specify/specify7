"use strict";

import $ from 'jquery';
import Q from 'q';
import Backbone from './backbone';
import _ from 'underscore';
import ace from 'brace';
import 'brace/mode/xml';
import 'brace/mode/json';
import 'brace/mode/properties';

import * as app from './specifyapp';
import schema from './schema';
import SaveButton from './savebutton';
import DeleteButton from './deletebutton';
import userInfo from './userinfo';
import * as navigation from './navigation';
import adminText from './localization/admin';
import commonText from './localization/common';
import {setTitle} from "./components/hooks";
import {className} from './components/basic';

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

// Copied from https://github.com/ajaxorg/ace/issues/3149#issuecomment-444570508
function setCommandEnabled(editor, name, enabled) {
    const command = editor.commands.byName[name];
    if (!command.bindKeyOriginal)
        command.bindKeyOriginal = command.bindKey;
    command.bindKey = enabled ? command.bindKeyOriginal : null;
    editor.commands.addCommand(command);
    // special case for backspace and delete which will be called from
    // textarea if not handled by main commandb binding
    if (!enabled) {
        var key = command.bindKeyOriginal;
        if (key && typeof key == "object")
            key = key[editor.commands.platform];
        if (/backspace|delete/i.test(key))
            editor.commands.bindKey(key, "null")
    }
}

const AppResourcePage = Backbone.View.extend({
    __name__: "AppresourcePage",
    tagName: 'section',
    className: `${className.containerFull} !flex-row`,
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
                $(`<p class="m-auto">${this.options.ResourceModel.getLocalizedName()} not found.</p>`).appendTo(this.el);
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
    if (appResource.get('mimetype') === 'application/json'){
        return "ace/mode/json";
    }
    return null;
}

const ResourceDataView = Backbone.View.extend({
    __name__: "AppResourceDataView",
    tagName: 'form',
    className: "bg-gray-200 flex-1 p-4 shadow-[0_3px_5px_-1px] shadow-gray-500 flex flex-col gap-y-2 rounded",
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
            const buttonsDiv = $(`<div class="${className.formFooter}" role="toolbar">`);
            this.appresourceData = sards.first();

            if (this.appresourceData) {
                this.$el.attr('aria-label',this.model.get('name'));
                $(`<header class="${className.formHeader}">`).append(
                    $('<h2 class="${className.formTitle}">').text(this.model.get('name'))
                ).appendTo(this.el);

                const toolbar = $('<div class="flex gap-2 items-center flex-wrap" role="toollbar"></div>').appendTo(this.el);

                $(`<label class="metadata-input flex-1 flex items-center gap-x-1">
                    ${commonText('metadataInline')}
                    <input class="flex-1" type="text" spellcheck="false" autocomplete="on" />
                <label>`).appendTo(toolbar);
                $('.metadata-input input', toolbar).val(this.model.get('metadata'));

                if (this.model.specifyModel.name === 'SpAppResource') {
                    $(`<label class="mimetype-input flex items-center gap-x-1">
                        ${adminText('mimetype')}
                        <input class="flex-1" type="text" spellcheck="false" autocomplete="on" />
                    <label>`).appendTo(toolbar);
                    $('.mimetype-input input', toolbar).val(this.model.get('mimetype'));
                }

                if (userInfo.isadmin) {
                    toolbar.append(
                      `<button type="button" class="load-file button">${adminText('loadFile')}</button>`
                    );
                }

                const blob = new Blob([this.appresourceData.get('data')], {type: this.model.get('mimetype') || ""});
                const url = (window.URL || window.webkitURL).createObjectURL(blob);
                $(`<a class="button">
                    ${commonText('download')}
                </a>`).attr({
                    href: url,
                    download: this.model.get('name') + fileExtFor(this.model)
                }).appendTo(toolbar);

                const editArea = $('<div class="border border-brand-200 flex-1">').appendTo(this.el);
                var editor = ace.edit(editArea[0], {
                    readOnly: !userInfo.isadmin,
                });
                editor.getSession().setMode(modeForResource(this.model));
                editor.setValue(this.appresourceData.get('data'));
                editor.setPrintMarginColumn(null);
                editor.clearSelection();

                editor.on('focus', ()=>{
                    setCommandEnabled(editor, "indent", true);
                    setCommandEnabled(editor, "outdent", true);
                });

                editor.commands.addCommand({
                  name: "escape",
                  bindKey: {win: "Esc", mac: "Esc"},
                  exec() {
                      setCommandEnabled(editor, "indent", false);
                      setCommandEnabled(editor, "outdent", false);
                  }
                });

                editor.on("change", () => {
                    this.appresourceData.set('data', editor.getValue(), {changedBy: editor});
                });

                this.appresourceData.on('change:data', (resource, value, options) => {
                    if (options.changedBy != editor) {
                        editor.setValue(this.appresourceData.get('data'));
                        editor.clearSelection();
                    }
                });

                if(userInfo.isadmin){
                    const saveButton = new SaveButton({model: this.appresourceData})
                        .on('savecomplete', () => this.model.save())
                        .render();
                    saveButton.bindToForm(this.el);
                    buttonsDiv.append(`<span class="flex-1 -ml-2"></span>`);
                    buttonsDiv.append(saveButton.el);
                }
            } else {
                $(`<p aria-live="polite">${adminText('corruptResourceOrConflict')}</p>`).appendTo(this.el);
            }

            userInfo.isadmin &&  buttonsDiv.prepend(
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
        const dialog = $(`<div>
            ${adminText('resourceLoadDialogHeader')}
            <p>${adminText('resourceLoadDialogMessage')}</p>
        </div>`).append(fileInput).dialog({
            modal: true,
            title: adminText('resourceLoadDialogTitle'),
            close: function() { $(this).remove(); },
            buttons: { [commonText('cancel')]() { $(this).dialog('close'); } }
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
    tagName: 'li',
    initialize({selectedResource}) {
        this.isSelected = this.model === selectedResource;
    },
    render() {
        this.el.role = 'treeitem';
        this.el.ariaExpanded = true;
        this.$el.append(
            $('<a>', {
                href: makeUrl(this.model),
                text: this.model.get('name'),
                'class': `intercept-navigation ${this.isSelected ? 'text-brand-300' : ''}`,
                'aria-current': this.isSelected ? 'page' : 'false',
            })
        );
        return this;
    }
});

const ResourceList = Backbone.View.extend({
    __name__: "ResourceListView",
    tagName: 'ul',
    className: 'ml-4',
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
        this.el.role = 'group';
        this.$el.append(
            this.views.map(v => v.render().el)
        );
        if (userInfo.isadmin){
            const button = $(`<li role="treeitem">
                <button
                    type="button"
                    class="link"
                >
                    ${commonText('newResourceTitle')(this.ResourceModel.getLocalizedName())}
                </button>
            </li>`);
            button.on('click',this.openNameDialog.bind(this));
            this.$el.append(button);
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

        const createResource = function(event) {
            event.preventDefault();
            dialog.dialog('close');
            thisCreateResource( $('input', this).val() );
        };

        const dialog = $(`<div>
            ${adminText('createResourceDialogHeader')}
            <form id="app-resources-new-resource-form" class="not-submitted">
                <label class="${className.label}">
                    ${adminText('newResourceName')}
                    <input type="text" spellcheck="on" required>
                </label>
            </form>
        </div>`).dialog({
            title: adminText('createResourceDialogTitle'),
            width: 350,
            modal: true,
            close: function() { $(this).remove(); },
            buttons: [
                {
                    text: commonText('create'),
                    click(){ /* Submit form */ },
                    type: 'submit',
                    form: 'app-resources-new-resource-form',
                },
                {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
            ]});
        $('form', dialog).submit(createResource);
    }
});

const AppResourcesView = Backbone.View.extend({
    __name__: "AppResourcesView",
    tagName: 'aside',
    className: 'bg-gray-200 p-4 shadow-[0_3px_5px_-1px] shadow-gray-500 rounded overflow-y-auto',
    events: {
        'click .toggle-content': 'toggle'
    },
    render() {
        this.$el.append(
            $('<h2>').text(this.options.ResourceModel.getLocalizedName()),
            $('<ul role="tree" class="ml-4">')
                .append(new GlobalResourcesView(this.options).render().el)
                .append(new DisciplinesView(this.options).render().el)
        );
        return this;
    },
    toggle(evt) {
        const header = $(evt.currentTarget);
        const toToggle = header.next();
        const isVisible = toToggle.is(":visible");
        setStoredToggleState(this.options.ResourceModel, header.data('appdir'), !isVisible);
        toToggle[0].ariaExpanded = !isVisible;
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
    tagName: 'li',
    initialize({directories, resources, selectedResource, ResourceModel}) {
        // there are multiple "global" directories
        // distinguished by the usertype field
        // i'm not going to bother separating them out for now
        this.directories = directories
                  .filter(d => d.get('discipline') == null);

        const dirURIs = this.directories.map(d => d.get('resource_uri'));

        this.resourceList = new ResourceList({
            resources: resources.filter(r => dirURIs.includes(r.get('spappresourcedir'))),
            selectedResource: selectedResource,
            getDirectory: () => this.getDirectory(),
            ResourceModel: ResourceModel
        });
    },
    render() {
        this.$el.append(
            `<button type="button" class="toggle-content link" data-appdir="global">
                ${adminText('globalResourcesTitle')(this.resourceList.resources.length)}
            </button>`,
            this.resourceList.render().$el
                .toggle(this.resourceList.containsSelected || getStoredToggleState(this.options.ResourceModel, 'global'))
        );
        return this;
    },
    getDirectory() {
        // all new resources will be added to the common directory
        // because, why not?
        let directory = this.directories.filter(d => d.get('usertype') === 'Common')[0];
        if (directory != null) return Q(directory);
        directory = new schema.models.SpAppResourceDir.Resource({
            ispersonal: false,
            usertype: 'Common'
        }, {noBusinessRules: true});
        directory.set({collection: null, discipline: null}); // The collection gets set automatically by the 'newresource' event on the api.
        return Q(directory.save()).then(() => directory);
    }
});

const DisciplinesView = Backbone.View.extend({
    __name__: "DisciplineView",
    tagName: 'li',
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
           `<button type="button" class="toggle-content link" data-appdir="disciplines">
                ${adminText('disciplineResourcesTitle')(this.count)}
            </button>`,
            $('<ul role="group" class="ml-4">').append(this.views.map(v => v.render().el))
                .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'disciplines'))
        );
        return this;
    }
});

const DisciplineResourcesView = Backbone.View.extend({
    __name__: "DisciplineResourcesView",
    tagName: 'li',
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
        this.el.role='treeitem';
        this.$el.append(
            $(`<button type="button" class="toggle-content link">
                ${this.discipline.get('name')}
                <small>(${this.count})</small>
            </button>`).data('appdir', this.discipline.get('resource_uri')),
            $('<ul role="group" class="ml-4">').append(
                this.resourceList.render().el.children,
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
    tagName: 'li',
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
        this.el.role = 'treeitem';
        this.$el.append(
            $(`<button type="button" class="toggle-content link">
                ${this.collection.get('collectionname')}
                <small>(${this.count})</small>
            </button>`).data('appdir', this.discipline.get('resource_uri')),
            $('<ul role="group" class="ml-4">').append(
                this.resourceList.render().el.children,
                $(`<li role="treeitem">
                    <button type="button" class="toggle-content link" data-appdir="usertypes">
                        ${adminText('userTypes')}
                        <small>(${this.userTypeView.count})</small>
                    </button>
                </li>`)
                    .data('appdir', this.discipline.get('resource_uri'))
                    .append(
                        this.userTypeView.render().el
                    ),
              $(`<li role="treeitem">
                  <button type="button" class="toggle-content link" data-appdir="users">
                      ${adminText('users')}
                      <small>(${this.userView.count})</small>
                  </button>
              </li>`)
                    .data('appdir', this.discipline.get('resource_uri'))
                    .append(this.userView.render().el),
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
    tagName: 'ul',
    className: 'ml-4',
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
        this.el.role = 'group';
        this.$el.append(this.views.map(v => v.render().el))
            .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'usertypes'));
        return this;
    }
});

const UserTypeResourcesView = Backbone.View.extend({
    __name__: "UserTypeResourcesView",
    tagName: 'li',
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
        this.el.role = 'treeitem';
        this.$el.append(
            $(`<button type="button" class="toggle-content link" data-appdir="users">
                ${this.usertype}
                <small>(${this.count})</small>
            </button>`).data('appdir', `usertype-${this.usertype}`),
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
    tagName: 'ul',
    className: 'ml-4',
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
        this.el.role = 'group';
        this.$el.append(this.views.map(v => v.render().el))
            .toggle(this.containsSelected || getStoredToggleState(this.options.ResourceModel, 'users'));
        return this;
    }
});


const UserResourcesView = Backbone.View.extend({
    __name__: "UserResourcesView",
    tagName: 'li',
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
        this.el.role = 'treeitem';
        this.$el.append(
            $(`<button type="button" class="toggle-content link" data-appdir="users">
                ${this.user.get('name')}
                <small>(${this.count})</small>
            </button>`).data('appdir', this.user.get('resource_uri')),
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
    setTitle(ResourceModel.getLocalizedName());

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

export const appResources = id => appResourcesTask(schema.models.SpAppResource, id);
export const viewSets = id => appResourcesTask(schema.models.SpViewSetObj, id);
