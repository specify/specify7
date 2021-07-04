"use strict";

const $ = require('jquery');
const Backbone = require('./backbone.js');

const navigation = require('./navigation.js');
const userInfo = require('./userinfo.js');
const queryText = require('./localization/query').default;
const commonText = require('./localization/common').default;

module.exports = Backbone.View.extend({
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
            this.$el.append(`<p>${queryText('saveClonedQueryDialogMessage')}</p>`);
        } else {
            this.$el.append(`<p>${queryText('saveQueryDialogMessage')}</p>`);
        }

        this.$el.append(`<form><label>${queryText('queryName')} <input type="text"/></label></form>`);

        this.$el.dialog({
            title: queryText('saveQueryDialogTitle'),
            modal: true,
            close() { $(this).remove(); },
            buttons: {
                [commonText('save')]: () => this.doSave(),
                [commonText('cancel')]() { $(this).dialog('close'); }
            }
        });

        this.$(':input').val(this.query.get('name')).focus().select();

        if (!this.query.isNew() && !this.clone) {
            this.doSave();
        }

        return this;
    },

    doSave(evt) {
        evt && evt.preventDefault();
        const name = this.$(':input').val().trim();
        if (name === '') return;

        const query = this.clone ? this.query.clone() : this.query;
        query.set('name', name);

        this.clone && query.set('specifyuser', userInfo.resource_uri);

        query.save().done(() => {
            this.$el.dialog('close');

            navigation.removeUnloadProtect(this.queryBuilder);
            this.clone ?
                navigation.go(`/specify/query/${query.id}/`) :
                this.queryBuilder.trigger('redisplay');
        });

        this.$el
            .dialog('option', 'title', queryText('savingQueryDialogTitle'))
            .dialog('option', 'buttons', []);

        this.$(':input').prop('readonly', true);
    }
});
