"use strict";

import $ from 'jquery';
import Backbone from './backbone';

import * as navigation from './navigation';
import userInfo from './userinfo';
import queryText from './localization/query';
import commonText from './localization/common';
import {BackboneLoadingScreen} from './components/modaldialog';

export default Backbone.View.extend({
    __name__: "QuerySaveDialog",
    events: {
        'submit': 'doSave'
    },
    initialize({queryBuilder, clone=false}) {
        this.queryBuilder = queryBuilder;
        this.query = queryBuilder.query;
        this.clone = clone;
    },
    render() {
        if (this.clone) {
            this.$el
                .append(queryText('saveClonedQueryDialogHeader'))
                .append(`<p>${queryText('saveClonedQueryDialogMessage')}</p>`);
        } else {
            this.$el
                .append(queryText('saveQueryDialogHeader'))
                .append(`<p>${queryText('saveQueryDialogMessage')}</p>`);
        }

        this.$el.append(`<form><label>${queryText('queryName')} <input type="text" autocomplete="on" spellcheck="true" required /></label></form>`);

        this.$(':input').val(this.query.get('name')).focus().select();

        if (!this.query.isNew() && !this.clone)
            this.doSave();
        else
            this.$el.dialog({
                title: queryText('saveQueryDialogTitle'),
                modal: true,
                close() { $(this).remove(); },
                buttons: {
                    [commonText('save')]: () => this.doSave(),
                    [commonText('cancel')]() { $(this).dialog('close'); }
                }
            });

        return this;
    },

    async doSave(evt) {
        evt && evt.preventDefault();
        const name = this.$(':input').val().trim();
        if (name === '') return;

        const query = this.clone ? this.query.clone() : this.query;
        query.set('name', name);

        this.clone && query.set('specifyuser', userInfo.resource_uri);

        if(this.el.classList.contains('ui-dialog-content'))
            this.$el.dialog('close');
        const loadingScreen = new BackboneLoadingScreen().render();

        await new Promise((resolve)=>query.save().done(resolve));

        loadingScreen.remove();

        navigation.removeUnloadProtect(this.queryBuilder);
        this.clone ?
            navigation.go(`/specify/query/${query.id}/`) :
            this.queryBuilder.trigger('redisplay');
    }
});
